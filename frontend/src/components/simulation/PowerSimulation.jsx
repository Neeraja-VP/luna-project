import React, { useState, useEffect } from 'react';
import {
  BatteryCharging,
  Zap,
  Sun,
  ShieldAlert,
  Sliders,
  RotateCcw,
  Activity,
  Layers,
  Flame,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { simulateMission } from '../../services/api';
import {
  DEFAULT_SIMULATION_CONFIG,
  SIMULATION_PRESETS,
} from '../../utils/constants';
import MetricCard from '../common/MetricCard';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import {
  formatPercent,
  formatPowerW,
  formatEnergyKWh,
  formatDateTime,
  formatDateShort,
} from '../../utils/formatters';

export default function PowerSimulation({
  currentSite,
  missionConfig,
}) {
  const [simConfig, setSimConfig] = useState(DEFAULT_SIMULATION_CONFIG);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeChart, setActiveChart] = useState('soc'); // 'soc' | 'power'

  const handleRunSimulation = async () => {
    if (!currentSite) return;
    setLoading(true);
    setError(null);

    try {
      const res = await simulateMission({
        site_id: currentSite.id,
        start_date: new Date(missionConfig.startDate).toISOString(),
        duration_days: Number(missionConfig.durationDays),
        step_hours: Number(missionConfig.stepHours),
        ...simConfig,
      });
      setSimulationData(res);
    } catch (err) {
      console.error('Failed to run mission EPS simulation:', err);
      setError(err.response?.data?.error?.message || err.message || 'Mission energy simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentSite) {
      handleRunSimulation();
    }
  }, [currentSite?.id, missionConfig.startDate, missionConfig.durationDays]);

  const applyPreset = (key) => {
    const p = SIMULATION_PRESETS[key];
    if (p) {
      const { name, ...cfg } = p;
      setSimConfig(cfg);
    }
  };

  const series = simulationData?.time_series || [];

  return (
    <div className="space-y-6">
      {/* 1. TOP TELEMETRY KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Min Battery SoC"
          value={simulationData ? formatPercent(simulationData.min_battery_soc_percent) : '—'}
          sublabel={
            simulationData?.battery_depleted
              ? 'CRITICAL: BATTERY DEPLETED'
              : `Safety margin: +${(simulationData?.min_battery_soc_percent - simConfig.min_safe_soc_percent).toFixed(1)}%`
          }
          icon={BatteryCharging}
          status={
            simulationData?.battery_depleted
              ? 'danger'
              : simulationData?.min_battery_soc_percent < simConfig.min_safe_soc_percent
              ? 'warning'
              : 'success'
          }
        />
        <MetricCard
          label="Solar Generation"
          value={simulationData ? formatEnergyKWh(simulationData.total_energy_generated_kwh) : '—'}
          sublabel="Total solar array yield"
          icon={Sun}
          status="solar"
        />
        <MetricCard
          label="Total Consumption"
          value={simulationData ? formatEnergyKWh(simulationData.total_energy_consumed_kwh) : '—'}
          sublabel="Hotel + payload + survival heaters"
          icon={Zap}
          status="neutral"
        />
        <MetricCard
          label="Net Energy Balance"
          value={simulationData ? formatEnergyKWh(simulationData.net_energy_balance_kwh) : '—'}
          sublabel={simulationData?.net_energy_balance_kwh >= 0 ? 'Net positive energy' : 'Net deficit balance'}
          icon={Activity}
          status={simulationData?.net_energy_balance_kwh >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Battery Depletion Warning Banner */}
      {simulationData && simulationData.battery_depleted && (
        <div className="flex items-center space-x-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-xs font-mono text-rose-300 shadow-md">
          <ShieldAlert className="h-6 w-6 text-rose-400 shrink-0" />
          <div>
            <span className="font-bold uppercase block text-sm">MISSION SURVIVAL HAZARD: BATTERY DEPLETION</span>
            <span>
              Lander electrical energy storage reaches 0.0% during extended shadow periods. Increase solar array area, enlarge battery capacity, or select a site with shorter continuous shadows.
            </span>
          </div>
        </div>
      )}

      {/* 2. SIMULATION CONTROLS & ARCHITECTURE PRESETS */}
      <div className="rounded-2xl border border-luna-800 bg-luna-900/60 p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-luna-800">
          <div>
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Lander Electrical Power System (EPS) Parameters</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate solar array harvest, battery state-of-charge, and nighttime thermal survival load.
            </p>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="flex items-center space-x-1.5 rounded-lg border border-amber-500/40 bg-amber-500/20 px-3.5 py-1.5 font-mono text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-all shadow-sm disabled:opacity-50"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>{loading ? 'SIMULATING...' : 'RUN EPS SIMULATION'}</span>
          </button>
        </div>

        {/* Architecture Presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Architecture Presets:</span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SIMULATION_PRESETS).map(([k, p]) => (
              <button
                key={k}
                onClick={() => applyPreset(k)}
                className="rounded-lg border border-luna-800 bg-luna-950 px-2.5 py-1 text-xs font-mono text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Parameter Inputs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono pt-2">
          <div>
            <label className="text-slate-400 block mb-1">Solar Area (m²)</label>
            <input
              type="number"
              min="0.5"
              max="50"
              step="0.5"
              value={simConfig.solar_array_area_m2}
              onChange={(e) => setSimConfig({ ...simConfig, solar_array_area_m2: Number(e.target.value) })}
              className="w-full rounded bg-luna-950 border border-luna-700 px-2.5 py-1.5 text-slate-200"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Cell Efficiency</label>
            <input
              type="number"
              min="0.10"
              max="0.45"
              step="0.01"
              value={simConfig.solar_efficiency}
              onChange={(e) => setSimConfig({ ...simConfig, solar_efficiency: Number(e.target.value) })}
              className="w-full rounded bg-luna-950 border border-luna-700 px-2.5 py-1.5 text-slate-200"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Battery (Wh)</label>
            <input
              type="number"
              min="500"
              max="50000"
              step="500"
              value={simConfig.battery_capacity_wh}
              onChange={(e) => setSimConfig({ ...simConfig, battery_capacity_wh: Number(e.target.value) })}
              className="w-full rounded bg-luna-950 border border-luna-700 px-2.5 py-1.5 text-slate-200"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Tracking Type</label>
            <select
              value={simConfig.solar_tracking_type}
              onChange={(e) => setSimConfig({ ...simConfig, solar_tracking_type: e.target.value })}
              className="w-full rounded bg-luna-950 border border-luna-700 px-2 py-1.5 text-slate-200"
            >
              <option value="VERTICAL_AZIMUTH_TRACKING">Vertical Azimuth Tracking</option>
              <option value="FIXED_VERTICAL">Fixed Vertical Panel</option>
              <option value="HORIZONTAL_FLAT">Horizontal Flat Panel</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Hotel Load (W)</label>
            <input
              type="number"
              min="10"
              max="1000"
              value={simConfig.base_hotel_load_w}
              onChange={(e) => setSimConfig({ ...simConfig, base_hotel_load_w: Number(e.target.value) })}
              className="w-full rounded bg-luna-950 border border-luna-700 px-2.5 py-1.5 text-slate-200"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Payload Load (W)</label>
            <input
              type="number"
              min="0"
              max="1000"
              value={simConfig.payload_active_load_w}
              onChange={(e) => setSimConfig({ ...simConfig, payload_active_load_w: Number(e.target.value) })}
              className="w-full rounded bg-luna-950 border border-luna-700 px-2.5 py-1.5 text-slate-200"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Heater Load (W)</label>
            <input
              type="number"
              min="0"
              max="1000"
              value={simConfig.survival_heater_load_w}
              onChange={(e) => setSimConfig({ ...simConfig, survival_heater_load_w: Number(e.target.value) })}
              className="w-full rounded bg-luna-950 border border-luna-700 px-2.5 py-1.5 text-slate-200"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Min Safe SoC (%)</label>
            <input
              type="number"
              min="5"
              max="50"
              value={simConfig.min_safe_soc_percent}
              onChange={(e) => setSimConfig({ ...simConfig, min_safe_soc_percent: Number(e.target.value) })}
              className="w-full rounded bg-luna-950 border border-luna-700 px-2.5 py-1.5 text-slate-200"
            />
          </div>
        </div>
      </div>

      {loading && <LoadingState title="Simulating Battery State-of-Charge Dynamics..." subtitle="Iterating electrical energy storage differential equations across mission duration." />}

      {error && <ErrorState title="Simulation Failed" message={error} onRetry={handleRunSimulation} />}

      {/* 3. SIMULATION CHARTS */}
      {!loading && !error && series.length > 0 && (
        <div className="rounded-2xl border border-luna-800 bg-luna-900/60 p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-luna-800">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
              Energy Storage &amp; Power Generation Curves
            </h3>

            <div className="flex items-center space-x-1 rounded-xl border border-luna-800 bg-luna-950 p-1 text-xs font-mono">
              <button
                onClick={() => setActiveChart('soc')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  activeChart === 'soc'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Battery SoC (%)
              </button>
              <button
                onClick={() => setActiveChart('power')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  activeChart === 'power'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Net Power (W)
              </button>
            </div>
          </div>

          {/* CHART 1: BATTERY STATE OF CHARGE */}
          {activeChart === 'soc' && (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="socGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#64748B"
                    tickFormatter={formatDateShort}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="#64748B" unit="%" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#222E4A', borderRadius: '8px' }}
                    labelFormatter={formatDateTime}
                    formatter={(val, name) => [`${Number(val).toFixed(1)}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine
                    y={simConfig.min_safe_soc_percent}
                    stroke="#EF4444"
                    strokeDasharray="3 3"
                    label={`Min Safe ${simConfig.min_safe_soc_percent}%`}
                  />
                  <Area
                    type="monotone"
                    dataKey="battery_soc_percent"
                    name="Battery State of Charge (%)"
                    stroke="#10B981"
                    fill="url(#socGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* CHART 2: SOLAR POWER VS ELECTRICAL LOAD */}
          {activeChart === 'power' && (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#64748B"
                    tickFormatter={formatDateShort}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="#64748B" unit=" W" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#222E4A', borderRadius: '8px' }}
                    labelFormatter={formatDateTime}
                    formatter={(val, name) => [`${Number(val).toFixed(1)} W`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={0} stroke="#64748B" />
                  <Line
                    type="monotone"
                    dataKey="solar_generation_w"
                    name="Solar Generation (W)"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_load_w"
                    name="Total Electrical Load (W)"
                    stroke="#EF4444"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="net_power_w"
                    name="Net Power Margin (W)"
                    stroke="#06B6D4"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
