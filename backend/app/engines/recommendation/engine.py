"""
LUNA NAVIGATOR — Recommendation Engine (Member 4 Ownership)
Implements Multi-Criteria Decision Analysis (MCDA) for lunar landing site selection and ranking.
"""

from typing import List, Dict, Optional
from app.core.sites_catalog import load_candidate_sites, get_site_by_id
from app.engines.illumination.engine import illumination_engine
from app.engines.communication.engine import communication_engine
from app.schemas.illumination import IlluminationRequest
from app.schemas.communication import CommunicationRequest
from app.schemas.compare import CompareRequest, SiteComparisonMetrics, CompareResponse
from app.schemas.recommend import (
    RecommendRequest,
    RankedSite,
    DisqualifiedSite,
    RecommendResponse
)


class RecommendationEngine:
    """
    Ranks candidate landing sites using multi-criteria weighted scoring and operational constraints.
    """
    
    def evaluate_site_metrics(
        self,
        site_id: str,
        start_date,
        duration_days: float,
        step_hours: float = 2.0
    ) -> Optional[SiteComparisonMetrics]:
        site = get_site_by_id(site_id)
        if not site:
            return None
            
        # 1. Illumination metrics
        illum_req = IlluminationRequest(
            latitude=site.latitude,
            longitude=site.longitude,
            elevation_m=site.elevation_m,
            start_date=start_date,
            duration_days=duration_days,
            step_hours=step_hours
        )
        illum_res = illumination_engine.calculate_illumination(illum_req)
        
        # 2. Communication metrics
        comm_req = CommunicationRequest(
            latitude=site.latitude,
            longitude=site.longitude,
            elevation_m=site.elevation_m,
            start_date=start_date,
            duration_days=duration_days,
            step_hours=step_hours
        )
        comm_res = communication_engine.calculate_communication(comm_req)
        
        # Baseline composite score (equal weights)
        slope_score = max(0.0, 100.0 - (site.slope_degrees / 15.0) * 100.0)
        elev_score = min(100.0, max(0.0, (site.elevation_m + 1000.0) / 60.0))
        composite = (
            0.35 * illum_res.illumination_percentage +
            0.30 * comm_res.communication_availability_percentage +
            0.20 * slope_score +
            0.15 * elev_score
        )
        
        return SiteComparisonMetrics(
            site_id=site.id,
            name=site.name,
            latitude=site.latitude,
            longitude=site.longitude,
            elevation_m=site.elevation_m,
            slope_degrees=site.slope_degrees,
            illumination_percentage=illum_res.illumination_percentage,
            max_shadow_hours=illum_res.longest_continuous_shadow_hours,
            communication_percentage=comm_res.communication_availability_percentage,
            max_comm_blackout_hours=comm_res.longest_continuous_blackout_hours,
            overall_suitability_score=round(composite, 1)
        )

    def compare_sites(self, request: CompareRequest) -> CompareResponse:
        results: List[SiteComparisonMetrics] = []
        for s_id in request.site_ids:
            metrics = self.evaluate_site_metrics(
                site_id=s_id,
                start_date=request.start_date,
                duration_days=request.duration_days,
                step_hours=request.step_hours
            )
            if metrics:
                results.append(metrics)
                
        # Sort descending by suitability score
        results.sort(key=lambda x: x.overall_suitability_score, reverse=True)
        return CompareResponse(
            start_date=request.start_date,
            duration_days=request.duration_days,
            sites_evaluated=results
        )

    def recommend_sites(self, request: RecommendRequest) -> RecommendResponse:
        all_sites = load_candidate_sites()
        target_sites = all_sites
        if request.site_ids:
            target_sites = [s for s in all_sites if s.id in request.site_ids]
            
        ranked_list: List[RankedSite] = []
        disqualified_list: List[DisqualifiedSite] = []
        
        w = request.weights
        c = request.constraints
        # Normalize weights
        weight_sum = w.solar_illumination + w.earth_communication + w.slope_safety + w.elevation_advantage
        if weight_sum <= 0:
            weight_sum = 1.0
        norm_w_illum = w.solar_illumination / weight_sum
        norm_w_comm = w.earth_communication / weight_sum
        norm_w_slope = w.slope_safety / weight_sum
        norm_w_elev = w.elevation_advantage / weight_sum
        
        for site in target_sites:
            metrics = self.evaluate_site_metrics(
                site_id=site.id,
                start_date=request.start_date,
                duration_days=request.duration_days,
                step_hours=request.step_hours
            )
            if not metrics:
                continue
                
            violations = []
            if metrics.illumination_percentage < c.min_illumination_percentage:
                violations.append(f"Illumination {metrics.illumination_percentage}% < minimum threshold {c.min_illumination_percentage}%")
            if metrics.communication_percentage < c.min_communication_percentage:
                violations.append(f"Communication {metrics.communication_percentage}% < minimum threshold {c.min_communication_percentage}%")
            if metrics.slope_degrees > c.max_acceptable_slope_degrees:
                violations.append(f"Slope {metrics.slope_degrees}° exceeds maximum limit {c.max_acceptable_slope_degrees}°")
            if metrics.max_shadow_hours > c.max_continuous_shadow_hours:
                violations.append(f"Longest shadow {metrics.max_shadow_hours}h exceeds allowable {c.max_continuous_shadow_hours}h")
                
            # Component scores normalized [0 - 100]
            score_illum = metrics.illumination_percentage
            score_comm = metrics.communication_percentage
            score_slope = max(0.0, 100.0 - (metrics.slope_degrees / c.max_acceptable_slope_degrees) * 100.0)
            score_elev = min(100.0, max(0.0, (metrics.elevation_m + 1000.0) / 60.0))
            
            total_score = round(
                norm_w_illum * score_illum +
                norm_w_comm * score_comm +
                norm_w_slope * score_slope +
                norm_w_elev * score_elev,
                1
            )
            
            breakdown = {
                "solar_illumination": round(score_illum, 1),
                "earth_communication": round(score_comm, 1),
                "slope_safety": round(score_slope, 1),
                "elevation_advantage": round(score_elev, 1)
            }
            raw = {
                "illumination_percentage": metrics.illumination_percentage,
                "longest_shadow_hours": metrics.max_shadow_hours,
                "communication_percentage": metrics.communication_percentage,
                "longest_blackout_hours": metrics.max_comm_blackout_hours,
                "slope_degrees": metrics.slope_degrees,
                "elevation_m": metrics.elevation_m
            }
            
            explanation = (
                f"Evaluated with composite suitability of {total_score}/100. "
                f"Solar availability is {metrics.illumination_percentage}% (max shadow {metrics.max_shadow_hours}h), "
                f"Direct-to-Earth coverage is {metrics.communication_percentage}%, and terrain slope is {metrics.slope_degrees}°."
            )
            
            if violations:
                disqualified_list.append(DisqualifiedSite(
                    site_id=site.id,
                    name=site.name,
                    violations=violations
                ))
            else:
                ranked_list.append(RankedSite(
                    rank=0,  # Assigned after sorting
                    site_id=site.id,
                    name=site.name,
                    total_score=total_score,
                    is_compliant=True,
                    scores_breakdown=breakdown,
                    raw_metrics=raw,
                    explanation=explanation
                ))
                
        # Sort ranked sites descending
        ranked_list.sort(key=lambda x: x.total_score, reverse=True)
        for i, s in enumerate(ranked_list, start=1):
            s.rank = i
            
        return RecommendResponse(
            start_date=request.start_date,
            duration_days=request.duration_days,
            weights_applied=w,
            ranking=ranked_list,
            disqualified_sites=disqualified_list
        )


recommendation_engine = RecommendationEngine()
