import React, { useRef, useEffect } from 'react';
import { Compass, Sun, Radio, Mountain } from 'lucide-react';

export default function PolarRadarPlot({
  terrainHorizonData,
  illuminationData,
  communicationData,
  maxElevationDeg = 10.0,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const maxRadius = Math.min(w, h) * 0.42;

    // Helper: Map Azimuth (0° to 360°) and Elevation (-1° to maxElevationDeg) to canvas (x, y)
    // 0° Azimuth = North (Top, -Y), 90° = East (Right, +X), 180° = South, 270° = West
    // Center of radar = Zenith / high elevation (maxElevationDeg)
    // Outer perimeter = Horizon (0° or -1° elevation)
    function mapSkyToCanvas(azimuthDeg, elevationDeg) {
      // Norm elevation: 0 at maxElevationDeg (center), 1 at -1° (outer rim)
      const clampedEl = Math.max(-1.0, Math.min(elevationDeg, maxElevationDeg));
      const normalizedDist = (maxElevationDeg - clampedEl) / (maxElevationDeg + 1.0);
      const r = normalizedDist * maxRadius;

      // Azimuth angle in radians (0° North = -PI/2)
      const rad = ((azimuthDeg - 90.0) * Math.PI) / 180.0;
      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);
      return { x, y, r };
    }

    // 1. Radar background rings (Elevation circles: 0°, 2°, 4°, 6°, 8°, 10°)
    ctx.lineWidth = 1 * dpr;
    const elevationRings = [0, 2, 4, 6, 8, maxElevationDeg];
    elevationRings.forEach((el) => {
      const { r } = mapSkyToCanvas(0, el);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = el === 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(100, 116, 139, 0.25)';
      ctx.setLineDash(el === 0 ? [] : [3 * dpr, 3 * dpr]);
      ctx.stroke();

      // Elevation labels
      ctx.fillStyle = el === 0 ? '#EF4444' : '#64748B';
      ctx.font = `${8.5 * dpr}px JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`${el}°`, cx + 10 * dpr, cy - r + 3 * dpr);
    });

    // 2. Azimuth radial grid lines (every 45°)
    ctx.setLineDash([2 * dpr, 4 * dpr]);
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
    const cardinalLabels = ['N (0°)', 'NE (45°)', 'E (90°)', 'SE (135°)', 'S (180°)', 'SW (225°)', 'W (270°)', 'NW (315°)'];
    for (let i = 0; i < 8; i++) {
      const az = i * 45;
      const rad = ((az - 90.0) * Math.PI) / 180.0;
      const xOuter = cx + maxRadius * Math.cos(rad);
      const yOuter = cy + maxRadius * Math.sin(rad);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(xOuter, yOuter);
      ctx.stroke();

      // Cardinal labels
      const xText = cx + (maxRadius + 14 * dpr) * Math.cos(rad);
      const yText = cy + (maxRadius + 14 * dpr) * Math.sin(rad);
      ctx.fillStyle = az % 90 === 0 ? '#94A3B8' : '#475569';
      ctx.font = `${9 * dpr}px JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cardinalLabels[i], xText, yText);
    }
    ctx.setLineDash([]);

    // 3. Terrain Horizon Obstruction Mask (from LOLA DEM)
    if (terrainHorizonData && terrainHorizonData.horizon_points && terrainHorizonData.horizon_points.length > 0) {
      const pts = terrainHorizonData.horizon_points;
      ctx.save();
      ctx.beginPath();

      // Outer ring boundary
      ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);

      // Inner terrain contour path (in reverse to form a shaded doughnut)
      for (let i = pts.length - 1; i >= 0; i--) {
        const pt = pts[i];
        const { x, y } = mapSkyToCanvas(pt.azimuth_deg, pt.horizon_elevation_deg);
        if (i === pts.length - 1) {
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Terrain obstruction fill (dark crimson / volcanic terrain relief)
      ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      ctx.fill();

      // Terrain horizon ridge line
      ctx.beginPath();
      pts.forEach((pt, idx) => {
        const { x, y } = mapSkyToCanvas(pt.azimuth_deg, pt.horizon_elevation_deg);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Solar Trajectory Path (Amber)
    if (illuminationData && illuminationData.time_series && illuminationData.time_series.length > 0) {
      const series = illuminationData.time_series;
      ctx.save();
      ctx.beginPath();
      series.forEach((pt, idx) => {
        const { x, y } = mapSkyToCanvas(pt.sun_azimuth_deg, pt.sun_elevation_deg);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      // Draw Sun Points (Yellow = sunlit, Dark Orange = shadowed)
      series.forEach((pt, idx) => {
        // Sample points along path
        if (idx % Math.max(1, Math.floor(series.length / 24)) === 0) {
          const { x, y } = mapSkyToCanvas(pt.sun_azimuth_deg, pt.sun_elevation_deg);
          ctx.beginPath();
          ctx.arc(x, y, 3 * dpr, 0, Math.PI * 2);
          ctx.fillStyle = pt.is_sunlit_terrain ? '#FBBF24' : '#78350F';
          ctx.fill();
        }
      });

      // Latest Sun Position marker
      const latest = series[0];
      const { x, y } = mapSkyToCanvas(latest.sun_azimuth_deg, latest.sun_elevation_deg);
      ctx.beginPath();
      ctx.arc(x, y, 5.5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
      ctx.restore();
    }

    // 5. Earth Trajectory / Libration Path (Cyan)
    if (communicationData && communicationData.time_series && communicationData.time_series.length > 0) {
      const series = communicationData.time_series;
      ctx.save();
      ctx.beginPath();
      series.forEach((pt, idx) => {
        const { x, y } = mapSkyToCanvas(pt.earth_azimuth_deg, pt.earth_elevation_deg);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      // Earth Libration Points
      series.forEach((pt, idx) => {
        if (idx % Math.max(1, Math.floor(series.length / 24)) === 0) {
          const { x, y } = mapSkyToCanvas(pt.earth_azimuth_deg, pt.earth_elevation_deg);
          ctx.beginPath();
          ctx.arc(x, y, 3 * dpr, 0, Math.PI * 2);
          ctx.fillStyle = pt.is_earth_visible ? '#06B6D4' : '#164E63';
          ctx.fill();
        }
      });

      // Latest Earth Position marker
      const latest = series[0];
      const { x, y } = mapSkyToCanvas(latest.earth_azimuth_deg, latest.earth_elevation_deg);
      ctx.beginPath();
      ctx.arc(x, y, 5.5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = '#06B6D4';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
      ctx.restore();
    }
  }, [terrainHorizonData, illuminationData, communicationData, maxElevationDeg]);

  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-xl border border-luna-800 bg-luna-900/60">
      <div className="w-full flex items-center justify-between pb-2 border-b border-luna-800 text-xs font-mono">
        <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
          <Compass className="h-4 w-4 text-cyan-400" />
          <span>360° TOPOCENTRIC HORIZON SKY RADAR</span>
        </span>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1 text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
            <span>Sun Track</span>
          </span>
          <span className="flex items-center space-x-1 text-cyan-400">
            <span className="h-2 w-2 rounded-full bg-cyan-400 inline-block" />
            <span>Earth Libration</span>
          </span>
          <span className="flex items-center space-x-1 text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
            <span>Terrain Obstruction</span>
          </span>
        </div>
      </div>

      <div className="relative mt-2 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="h-[320px] w-[320px] md:h-[380px] md:w-[380px]"
        />
      </div>

      <div className="mt-2 text-center text-[10px] font-mono text-slate-500 max-w-md">
        Center represents zenith ({maxElevationDeg}° elevation); outer perimeter represents horizon (0°).
        Shaded red rim indicates terrain blocking direct line of sight.
      </div>
    </div>
  );
}
