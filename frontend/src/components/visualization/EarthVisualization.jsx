import React, { useState } from 'react';
import {
  Radio,
  Clock,
  Compass,
  Wifi,
  WifiOff,
  Signal,
  Mountain,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import MetricCard from '../common/MetricCard';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import PolarRadarPlot from '../explorer/PolarRadarPlot';
import { formatPercent, formatHours, formatDateTime, formatDateShort } from '../../utils/formatters';

export default function EarthVisualization({
  communicationData,
  terrainHorizonData,
  loading,
  error,
  onRetry,
}) {
  const [chartView, setChartView] = useState('elevation'); // 'elevation' | 'radar'

  if (loading) {
    return (
      <LoadingState
        title="Calculating Earth Visibility & Libration Vectors..."
        subtitle="Computing topocentric lunar libration in latitude (±6.7°) and longitude (±7.9°), Direct-to-Earth line-of-sight, and terrain horizon clearance."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Earth Communication Calculation Error"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!communicationData || !communicationData.time_series) {
    return (
      <div className="rounded-2xl border border-luna-800 bg-luna-900/60 p-10 text-center text-slate-500 font-mono text-xs">
        No Earth communication telemetry available for the current configuration.
      </div>
    );
  }

  const series = communicationData.time_series;

  return (
    <div className="space-y-6">
      {/* 1. TOP TELEMETRY KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="DTE Comm Availability"
          value={formatPercent(communicationData.communication_availability_percentage)}
          sublabel="Direct-to-Earth radio coverage"
          icon={Radio}
          status="earth"
        />
        <MetricCard
          label="Longest Comm Window"
          value={formatHours(communicationData.longest_continuous_comm_window_hours)}
          sublabel="Continuous downlink window"
          icon={Wifi}
          status="success"
        />
        <MetricCard
          label="Max Comm Blackout"
          value={formatHours(communicationData.longest_continuous_blackout_hours)}
          sublabel="Longest terrain / libration blackout"
          icon={WifiOff}
          status={communicationData.longest_continuous_blackout_hours > 40 ? 'danger' : 'warning'}
        />
        <MetricCard
          label="Total Visible Hours"
          value={formatHours(communicationData.total_visible_hours)}
          sublabel={`Blocked: ${formatHours(communicationData.total_blocked_hours)}`}
          icon={Signal}
          status="earth"
        />
      </div>

      {/* 2. MAIN TELECOMMUNICATION PANEL */}
      <div className="rounded-2xl border border-luna-800 bg-luna-900/60 p-5 space-y-4 shadow-lg">
        {/* Header & Chart View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-luna-800">
          <div>
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
              <Radio className="h-4 w-4" />
              <span>Direct-to-Earth (DTE) Elevation &amp; Libration Tracking</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Earth line-of-sight elevation accounting for lunar physical libration and local LOLA DEM topography
            </p>
          </div>

          <div className="flex items-center space-x-1 rounded-xl border border-luna-800 bg-luna-950 p-1 text-xs font-mono">
            {[
              { id: 'elevation', label: 'Elevation Angle (°)' },
              { id: 'radar', label: '360° Sky Radar' },
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setChartView(view.id)}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  chartView === view.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>

        {/* VIEW A: ELEVATION CHART */}
        {chartView === 'elevation' && (
          <div className="space-y-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="earthCommGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#64748B"
                    tickFormatter={formatDateShort}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#64748B"
                    unit="°"
                    tick={{ fontSize: 10 }}
                    domain={[-6, 10]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#222E4A', borderRadius: '8px' }}
                    labelFormatter={formatDateTime}
                    formatter={(val, name) => [`${Number(val).toFixed(2)}°`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={0.5} stroke="#38BDF8" strokeDasharray="2 2" label="Min 0.5° DTE Threshold" />

                  {/* Earth Elevation Line & Fill */}
                  <Area
                    type="monotone"
                    dataKey="earth_elevation_deg"
                    name="Earth Elevation (°)"
                    stroke="#06B6D4"
                    fill="url(#earthCommGradient)"
                    strokeWidth={2}
                  />

                  {/* Terrain Obstruction Mask */}
                  <Line
                    type="stepAfter"
                    dataKey="terrain_horizon_elevation_deg"
                    name="Local Terrain Horizon Mask (°)"
                    stroke="#EF4444"
                    strokeWidth={1.8}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* DTE Link Status Timeline Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>DTE LINK STATUS TIMELINE</span>
                <span>{series.length} Epoch Steps</span>
              </div>
              <div className="flex h-5 w-full rounded-md overflow-hidden border border-luna-800 bg-luna-950">
                {series.map((pt, i) => {
                  let bgColor = 'bg-cyan-500/90';
                  if (pt.link_status === 'TERRAIN_BLOCKED') bgColor = 'bg-rose-500/80';
                  else if (pt.link_status === 'BELOW_MIN_ELEVATION') bgColor = 'bg-amber-500/80';
                  else if (!pt.is_earth_visible) bgColor = 'bg-slate-900';

                  return (
                    <div
                      key={i}
                      title={`${formatDateTime(pt.timestamp)}: ${pt.link_status}`}
                      className={`h-full flex-1 ${bgColor}`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{formatDateShort(series[0]?.timestamp)}</span>
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 rounded-sm bg-cyan-500 inline-block" />
                    <span>Direct Line-of-Sight</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 rounded-sm bg-rose-500 inline-block" />
                    <span>Terrain Blocked</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 rounded-sm bg-amber-500 inline-block" />
                    <span>Below Min Elev</span>
                  </span>
                </div>
                <span>{formatDateShort(series[series.length - 1]?.timestamp)}</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW B: 360° SKY RADAR */}
        {chartView === 'radar' && (
          <PolarRadarPlot
            terrainHorizonData={terrainHorizonData}
            communicationData={communicationData}
            maxElevationDeg={10.0}
          />
        )}
      </div>
    </div>
  );
}
