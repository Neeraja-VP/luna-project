import React, { useState, useEffect } from 'react';
import {
  Scale,
  Sun,
  Radio,
  Mountain,
  Award,
  Check,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { compareSites } from '../../services/api';
import { formatLatitude, formatLongitude } from '../../utils/coordinates';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';

export default function SiteComparison({
  sites = [],
  missionConfig,
  onSelectSite,
}) {
  // Selected site IDs for comparison (default first 3)
  const [selectedIds, setSelectedIds] = useState(() => {
    return sites.slice(0, 3).map((s) => s.id);
  });

  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch comparison from backend
  const handleFetchComparison = async () => {
    if (selectedIds.length < 2) return;
    setLoading(true);
    setError(null);

    try {
      const res = await compareSites({
        site_ids: selectedIds,
        start_date: new Date(missionConfig.startDate).toISOString(),
        duration_days: Number(missionConfig.durationDays),
        step_hours: Math.max(2.0, Number(missionConfig.stepHours)),
      });
      setComparisonData(res);
    } catch (err) {
      console.error('Failed to compare candidate sites:', err);
      setError(err.response?.data?.error?.message || err.message || 'Comparison calculation failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedIds.length >= 2) {
      handleFetchComparison();
    }
  }, [selectedIds, missionConfig.startDate, missionConfig.durationDays]);

  const toggleSite = (siteId) => {
    if (selectedIds.includes(siteId)) {
      if (selectedIds.length <= 2) return; // keep at least 2
      setSelectedIds(selectedIds.filter((id) => id !== siteId));
    } else {
      if (selectedIds.length >= 6) return; // max 6
      setSelectedIds([...selectedIds, siteId]);
    }
  };

  // Find optimal values for highlighting
  const evaluated = comparisonData?.sites_evaluated || [];
  const maxIllum = Math.max(...evaluated.map((s) => s.illumination_percentage), 0);
  const maxComm = Math.max(...evaluated.map((s) => s.communication_percentage), 0);
  const minSlope = Math.min(...evaluated.map((s) => s.slope_degrees), Infinity);
  const maxScore = Math.max(...evaluated.map((s) => s.overall_suitability_score), 0);

  return (
    <div className="space-y-6">
      {/* 1. SELECTION BAR */}
      <div className="rounded-2xl border border-luna-800 bg-luna-900/60 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
              <Scale className="h-4 w-4" />
              <span>Multi-Site Candidate Comparison</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select 2 to 6 landing candidate zones to evaluate empirical trade-offs.
            </p>
          </div>

          <button
            onClick={handleFetchComparison}
            disabled={loading || selectedIds.length < 2}
            className="flex items-center space-x-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-3 py-1.5 font-mono text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'CALCULATING...' : 'RE-RUN COMPARISON'}</span>
          </button>
        </div>

        {/* Site Multi-Picker Pills */}
        <div className="flex flex-wrap gap-2 pt-2">
          {sites.map((site) => {
            const isChecked = selectedIds.includes(site.id);
            return (
              <button
                key={site.id}
                onClick={() => toggleSite(site.id)}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-mono transition-all border ${
                  isChecked
                    ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-200'
                    : 'border-luna-800 bg-luna-950 text-slate-400 hover:text-slate-200 hover:border-luna-700'
                }`}
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                    isChecked ? 'border-cyan-400 bg-cyan-500 text-black' : 'border-slate-600'
                  }`}
                >
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <span>{site.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading && <LoadingState title="Comparing Candidate Landing Zones..." subtitle="Evaluating cross-site solar illumination profiles, DTE communication line-of-sight, and terrain gradients." />}

      {error && <ErrorState title="Comparison Failed" message={error} onRetry={handleFetchComparison} />}

      {/* 2. VISUAL METRICS BAR CHART */}
      {!loading && !error && evaluated.length > 0 && (
        <div className="rounded-2xl border border-luna-800 bg-luna-900/60 p-5 space-y-4">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
            Side-by-Side Trade-off Analysis (Illumination % vs Earth Comm % vs Overall Suitability)
          </h3>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={evaluated}
                margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(name) => name.split(' ')[0]}
                />
                <YAxis stroke="#64748B" domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#222E4A', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="illumination_percentage"
                  name="Solar Illumination (%)"
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="communication_percentage"
                  name="Earth Communication (%)"
                  fill="#06B6D4"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="overall_suitability_score"
                  name="Suitability Score (/100)"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 3. COMPARATIVE DATA MATRIX TABLE */}
      {!loading && !error && evaluated.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-luna-800 bg-luna-900/60 shadow-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-luna-800 bg-luna-850/80 uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Candidate Landing Site</th>
                <th className="py-3 px-3 text-right">Coordinates</th>
                <th className="py-3 px-3 text-right">Elevation</th>
                <th className="py-3 px-3 text-right">Slope</th>
                <th className="py-3 px-3 text-right">Sunlight %</th>
                <th className="py-3 px-3 text-right">Max Shadow</th>
                <th className="py-3 px-3 text-right">Earth Comm %</th>
                <th className="py-3 px-3 text-right">Max Blackout</th>
                <th className="py-3 px-4 text-right">Suitability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luna-800/60 text-slate-200">
              {evaluated.map((site) => {
                const isTopScore = site.overall_suitability_score === maxScore;
                return (
                  <tr
                    key={site.site_id}
                    onClick={() => onSelectSite && onSelectSite(site.site_id)}
                    className="hover:bg-luna-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-white flex items-center space-x-2">
                      {isTopScore && <Award className="h-4 w-4 text-amber-400 shrink-0" />}
                      <span className="truncate max-w-[180px]">{site.name}</span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                      {formatLatitude(site.latitude)}, {formatLongitude(site.longitude)}
                    </td>
                    <td className="py-3 px-3 text-right text-cyan-400 font-bold">
                      {site.elevation_m}m
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={site.slope_degrees === minSlope ? 'text-emerald-400 font-bold' : 'text-slate-300'}
                      >
                        {site.slope_degrees}°
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold">
                      <span className={site.illumination_percentage === maxIllum ? 'text-amber-400' : 'text-slate-300'}>
                        {site.illumination_percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {site.max_shadow_hours}h
                    </td>
                    <td className="py-3 px-3 text-right font-bold">
                      <span className={site.communication_percentage === maxComm ? 'text-cyan-400' : 'text-slate-300'}>
                        {site.communication_percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {site.max_comm_blackout_hours}h
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-sm">
                      <span
                        className={
                          isTopScore
                            ? 'text-amber-300 rounded bg-amber-500/10 px-2 py-0.5 border border-amber-500/30'
                            : 'text-emerald-400'
                        }
                      >
                        {site.overall_suitability_score}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
