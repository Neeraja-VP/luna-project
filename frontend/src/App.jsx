import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sun,
  Radio,
  Mountain,
  Sliders,
  BatteryCharging,
  Layers,
  ChevronRight,
  Info,
  AlertTriangle,
  CheckCircle,
  Activity,
  Calendar,
  Clock,
  ShieldAlert,
  ArrowUpRight
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
  BarChart,
  Bar
} from 'recharts';

import {
  getSites,
  calculateEphemeris,
  getTerrainHorizon,
  calculateIllumination,
  calculateCommunication,
  recommendSites,
  simulateMission,
  checkHealth
} from './services/api';
import {
  DEFAULT_MISSION_CONFIG,
  DEFAULT_MCDA_WEIGHTS,
  DEFAULT_CONSTRAINTS,
  DEFAULT_SIMULATION_CONFIG
} from './utils/constants';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState('overview'); // overview, illumination, communication, terrain, ranking, simulation
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(false);

  // Candidate Sites & Selection
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('shackleton-rim');

  // Mission Parameters
  const [missionConfig, setMissionConfig] = useState(DEFAULT_MISSION_CONFIG);
  
  // Computed Engine Results
  const [illuminationData, setIlluminationData] = useState(null);
  const [communicationData, setCommunicationData] = useState(null);
  const [terrainData, setTerrainData] = useState(null);
  const [rankingData, setRankingData] = useState(null);
  const [simulationData, setSimulationData] = useState(null);

  // Weights for MCDA
  const [mcdaWeights, setMcdaWeights] = useState(DEFAULT_MCDA_WEIGHTS);
  const [mcdaConstraints, setMcdaConstraints] = useState(DEFAULT_CONSTRAINTS);

  // Simulation Parameters
  const [simConfig, setSimConfig] = useState(DEFAULT_SIMULATION_CONFIG);

  // 1. Initial Load: Check API Health & Fetch Sites
  useEffect(() => {
    async function init() {
      try {
        const health = await checkHealth();
        if (health.status === 'HEALTHY') {
          setApiOnline(true);
        }
      } catch (err) {
        console.warn('Backend API not yet reachable:', err.message);
        setApiOnline(false);
      }

      try {
        const sitesList = await getSites();
        setSites(sitesList);
        if (sitesList.length > 0) {
          setSelectedSiteId(sitesList[0].id);
        }
      } catch (err) {
        console.error('Failed to load candidate sites catalog', err);
      }
    }
    init();
  }, []);

  const currentSite = sites.find((s) => s.id === selectedSiteId) || sites[0] || null;

  // 2. Fetch Analysis Data when Site or Config Changes
  useEffect(() => {
    if (!currentSite) return;

    let isMounted = true;
    async function fetchAnalysis() {
      setLoading(true);
      try {
        const payloadBase = {
          latitude: currentSite.latitude,
          longitude: currentSite.longitude,
          elevation_m: currentSite.elevation_m,
          start_date: new Date(missionConfig.startDate).toISOString(),
          duration_days: Number(missionConfig.durationDays),
          step_hours: Number(missionConfig.stepHours),
        };

        // Fetch Illumination
        const illumRes = await calculateIllumination({
          ...payloadBase,
          use_terrain_horizon: missionConfig.useTerrainHorizon,
          mast_height_m: missionConfig.mastHeightM,
        });

        // Fetch Communication
        const commRes = await calculateCommunication({
          ...payloadBase,
          min_comm_elevation_deg: missionConfig.minCommElevationDeg,
          use_terrain_horizon: missionConfig.useTerrainHorizon,
        });

        // Fetch Horizon Profile
        const terrRes = await getTerrainHorizon({
          latitude: currentSite.latitude,
          longitude: currentSite.longitude,
          elevation_m: currentSite.elevation_m,
          azimuth_step_deg: 5.0,
          observer_height_m: missionConfig.mastHeightM,
        });

        if (isMounted) {
          setIlluminationData(illumRes);
          setCommunicationData(commRes);
          setTerrainData(terrRes);
        }
      } catch (err) {
        console.error('Error fetching site analysis:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAnalysis();
    return () => {
      isMounted = false;
    };
  }, [selectedSiteId, missionConfig, currentSite]);

  // 3. Trigger Recommendation & MCDA
  const handleRunRanking = async () => {
    setLoading(true);
    try {
      const res = await recommendSites({
        start_date: new Date(missionConfig.startDate).toISOString(),
        duration_days: Number(missionConfig.durationDays),
        step_hours: Number(missionConfig.stepHours) * 2, // slightly coarser step for multi-site fast scan
        weights: mcdaWeights,
        constraints: mcdaConstraints,
      });
      setRankingData(res);
    } catch (err) {
      console.error('Error running MCDA recommendation:', err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Trigger Energy Simulation
  const handleRunSimulation = async () => {
    if (!currentSite) return;
    setLoading(true);
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
      console.error('Error simulating mission energy:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-luna-950 text-slate-100 overflow-hidden font-sans">
      {/* TOP SCIENTIFIC EXECUTIVE BAR */}
      <header className="flex h-16 items-center justify-between border-b border-luna-800 bg-luna-900/80 px-6 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Compass className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-lg font-bold tracking-wider text-slate-100">LUNA NAVIGATOR</span>
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-xs text-cyan-300 border border-cyan-500/30">
                NASA SPACE APPS 2026
              </span>
            </div>
            <p className="text-xs text-slate-400">Lunar South-Pole Decision Support & Orbital Trajectory Engine</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 rounded-lg border border-luna-800 bg-luna-950/70 p-1">
          {[
            { id: 'overview', label: 'Overview', icon: Layers },
            { id: 'illumination', label: 'Solar Illumination', icon: Sun },
            { id: 'communication', label: 'Earth Comm (DTE)', icon: Radio },
            { id: 'terrain', label: 'Terrain Horizon', icon: Mountain },
            { id: 'ranking', label: 'MCDA Ranking', icon: Sliders },
            { id: 'simulation', label: 'Power Simulation', icon: BatteryCharging },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'ranking' && !rankingData) handleRunRanking();
                  if (tab.id === 'simulation' && !simulationData) handleRunSimulation();
                }}
                className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-luna-850'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* System telemetry indicator */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                apiOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 'bg-amber-500 animate-ping'
              }`}
            />
            <span className={apiOnline ? 'text-emerald-400' : 'text-amber-400'}>
              {apiOnline ? 'API TELEMETRY ONLINE' : 'CONNECTING API...'}
            </span>
          </div>
        </div>
      </header>

      {/* WORKSPACE BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT MISSION CONFIGURATION & CANDIDATE REGION SIDEBAR */}
        <aside className="w-80 border-r border-luna-800 bg-luna-900/60 p-4 flex flex-col space-y-5 overflow-y-auto">
          {/* Mission Window Parameters */}
          <div className="rounded-xl border border-luna-800 bg-luna-850/50 p-4 space-y-3">
            <h3 className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-cyan-400" />
              <span>Mission Epoch & Horizon</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Evaluation Epoch (UTC)</label>
                <input
                  type="datetime-local"
                  value={missionConfig.startDate}
                  onChange={(e) => setMissionConfig({ ...missionConfig, startDate: e.target.value })}
                  className="w-full rounded bg-luna-950 border border-luna-700 px-2.5 py-1.5 font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Duration (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={missionConfig.durationDays}
                    onChange={(e) => setMissionConfig({ ...missionConfig, durationDays: Number(e.target.value) })}
                    className="w-full rounded bg-luna-950 border border-luna-700 px-2.5 py-1.5 font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Time Step (hrs)</label>
                  <input
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={missionConfig.stepHours}
                    onChange={(e) => setMissionConfig({ ...missionConfig, stepHours: Number(e.target.value) })}
                    className="w-full rounded bg-luna-950 border border-luna-700 px-2.5 py-1.5 font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-luna-800 flex items-center justify-between">
                <span className="text-slate-400 text-xs">LOLA Terrain Mask</span>
                <input
                  type="checkbox"
                  checked={missionConfig.useTerrainHorizon}
                  onChange={(e) => setMissionConfig({ ...missionConfig, useTerrainHorizon: e.target.checked })}
                  className="h-4 w-4 rounded border-luna-700 bg-luna-950 text-cyan-500 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Mast Height (m)</span>
                <input
                  type="number"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={missionConfig.mastHeightM}
                  onChange={(e) => setMissionConfig({ ...missionConfig, mastHeightM: Number(e.target.value) })}
                  className="w-20 rounded bg-luna-950 border border-luna-700 px-2 py-1 font-mono text-slate-200 text-right focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Candidate Landing Sites Selector */}
          <div className="flex-1 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
              Candidate Landing Regions ({sites.length})
            </h3>

            <div className="space-y-1.5">
              {sites.map((site) => {
                const isSelected = site.id === selectedSiteId;
                return (
                  <button
                    key={site.id}
                    onClick={() => setSelectedSiteId(site.id)}
                    className={`w-full text-left rounded-lg p-3 transition-all border ${
                      isSelected
                        ? 'border-cyan-500/50 bg-cyan-950/20 text-white shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                        : 'border-luna-800/80 bg-luna-850/40 text-slate-300 hover:bg-luna-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs truncate">{site.name}</span>
                      <ArrowUpRight className={`h-3.5 w-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span>{site.latitude.toFixed(2)}° S, {site.longitude.toFixed(1)}° E</span>
                      <span className="text-cyan-400 font-semibold">{site.elevation_m}m</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* MAIN ANALYSIS CANVAS */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Site Header Banner */}
          {currentSite && (
            <div className="rounded-2xl border border-luna-800 bg-gradient-to-r from-luna-900 via-luna-850 to-luna-900 p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300">
                      REGION: {currentSite.region.toUpperCase()}
                    </span>
                    <span className="rounded bg-cyan-500/10 px-2 py-0.5 font-mono text-xs text-cyan-300 border border-cyan-500/30">
                      LAT: {currentSite.latitude}° | LON: {currentSite.longitude}°
                    </span>
                  </div>
                  <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight text-white">{currentSite.name}</h1>
                  <p className="mt-1 text-xs text-slate-400 max-w-3xl">{currentSite.description}</p>
                </div>

                {/* KPI Metric Pills */}
                <div className="flex items-center space-x-3">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center min-w-[100px]">
                    <span className="text-[10px] uppercase font-mono text-amber-400/80 block">Solar Sunlight</span>
                    <span className="text-xl font-bold font-mono text-amber-300">
                      {illuminationData ? `${illuminationData.illumination_percentage}%` : '—'}
                    </span>
                  </div>
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-center min-w-[100px]">
                    <span className="text-[10px] uppercase font-mono text-cyan-400/80 block">Earth DTE LOS</span>
                    <span className="text-xl font-bold font-mono text-cyan-300">
                      {communicationData ? `${communicationData.communication_availability_percentage}%` : '—'}
                    </span>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center min-w-[100px]">
                    <span className="text-[10px] uppercase font-mono text-emerald-400/80 block">Slope Hazard</span>
                    <span className="text-xl font-bold font-mono text-emerald-300">{currentSite.slope_degrees}°</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: OVERVIEW */}
          {activeTab === 'overview' && currentSite && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-luna-800 bg-luna-900/60 p-5 space-y-4">
                <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>Scientific & Geological Value</span>
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">{currentSite.scientific_interest}</p>

                <div className="space-y-2 pt-2 border-t border-luna-800">
                  <span className="text-xs uppercase font-mono text-slate-400 block">Primary Mission Classes:</span>
                  <div className="flex flex-wrap gap-2">
                    {currentSite.target_mission_class.map((c, i) => (
                      <span key={i} className="rounded-md bg-luna-800 px-2.5 py-1 font-mono text-xs text-slate-200">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-luna-800 bg-luna-900/60 p-5 space-y-4">
                <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-emerald-400 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Operational Advantages</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {currentSite.primary_advantages.map((adv, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-rose-400 flex items-center space-x-2 pt-2 border-t border-luna-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Terrain & Thermal Challenges</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {currentSite.primary_challenges.map((ch, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{ch}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* VIEW: SOLAR ILLUMINATION */}
          {activeTab === 'illumination' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-luna-800 bg-luna-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
                    <Sun className="h-4 w-4" />
                    <span>Solar Elevation Angle & Local Terrain Horizon Mask</span>
                  </h3>
                  {illuminationData && (
                    <div className="font-mono text-xs text-slate-400">
                      Total Sunlit: <span className="text-amber-400 font-bold">{illuminationData.total_sunlit_hours}h</span> | 
                      Max Shadow: <span className="text-rose-400 font-bold">{illuminationData.longest_continuous_shadow_hours}h</span>
                    </div>
                  )}
                </div>

                {illuminationData && illuminationData.time_series ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={illuminationData.time_series}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis
                          dataKey="timestamp"
                          stroke="#64748B"
                          tickFormatter={(t) => new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis stroke="#64748B" unit="°" domain={[-2, 4]} tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#222E4A', borderRadius: '8px' }}
                          labelFormatter={(t) => new Date(t).toLocaleString()}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line
                          type="monotone"
                          dataKey="sun_elevation_deg"
                          name="Sun Elevation (°)"
                          stroke="#F59E0B"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="stepAfter"
                          dataKey="terrain_horizon_elevation_deg"
                          name="Terrain Horizon Mask (°)"
                          stroke="#EF4444"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500 font-mono text-xs">
                    Calculating solar illumination series...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: EARTH COMMUNICATION */}
          {activeTab === 'communication' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-luna-800 bg-luna-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
                    <Radio className="h-4 w-4" />
                    <span>Earth Direct-to-Earth (DTE) Elevation & Libration Tracking</span>
                  </h3>
                  {communicationData && (
                    <div className="font-mono text-xs text-slate-400">
                      Comm Availability: <span className="text-cyan-400 font-bold">{communicationData.communication_availability_percentage}%</span> | 
                      Max Blackout: <span className="text-rose-400 font-bold">{communicationData.longest_continuous_blackout_hours}h</span>
                    </div>
                  )}
                </div>

                {communicationData && communicationData.time_series ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={communicationData.time_series}>
                        <defs>
                          <linearGradient id="commGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis
                          dataKey="timestamp"
                          stroke="#64748B"
                          tickFormatter={(t) => new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis stroke="#64748B" unit="°" domain={[-8, 10]} tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#222E4A', borderRadius: '8px' }}
                          labelFormatter={(t) => new Date(t).toLocaleString()}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Area
                          type="monotone"
                          dataKey="earth_elevation_deg"
                          name="Earth Elevation (°)"
                          stroke="#06B6D4"
                          fill="url(#commGradient)"
                          strokeWidth={2}
                        />
                        <Line
                          type="stepAfter"
                          dataKey="terrain_horizon_elevation_deg"
                          name="Local Horizon Mask (°)"
                          stroke="#EF4444"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500 font-mono text-xs">
                    Calculating Earth visibility series...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: TERRAIN HORIZON */}
          {activeTab === 'terrain' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-luna-800 bg-luna-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-emerald-400 flex items-center space-x-2">
                    <Mountain className="h-4 w-4" />
                    <span>360° Panoramic Terrain Horizon Elevation (NASA LOLA DEM)</span>
                  </h3>
                  {terrainData && (
                    <div className="font-mono text-xs text-slate-400">
                      Max Obstruction: <span className="text-rose-400 font-bold">{terrainData.max_horizon_elevation_deg}°</span> | 
                      Min: <span className="text-emerald-400 font-bold">{terrainData.min_horizon_elevation_deg}°</span>
                    </div>
                  )}
                </div>

                {terrainData && terrainData.horizon_points ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={terrainData.horizon_points}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis dataKey="azimuth_deg" stroke="#64748B" unit="°" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#64748B" unit="°" tick={{ fontSize: 10 }} domain={[-1, 4]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#222E4A', borderRadius: '8px' }}
                          formatter={(v) => [`${v}°`, 'Horizon Elevation']}
                          labelFormatter={(az) => `Azimuth: ${az}°`}
                        />
                        <Area
                          type="monotone"
                          dataKey="horizon_elevation_deg"
                          name="Horizon Elevation (°)"
                          stroke="#10B981"
                          fill="#10B981"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500 font-mono text-xs">
                    Generating terrain horizon profile...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: MCDA RANKING & RECOMMENDATION */}
          {activeTab === 'ranking' && (
            <div className="space-y-6">
              {/* Weight sliders panel */}
              <div className="rounded-xl border border-luna-800 bg-luna-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
                    <Sliders className="h-4 w-4" />
                    <span>MCDA Decision Weight Configuration</span>
                  </h3>
                  <button
                    onClick={handleRunRanking}
                    disabled={loading}
                    className="rounded-lg bg-cyan-500/20 px-3 py-1.5 font-mono text-xs font-semibold text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all"
                  >
                    {loading ? 'CALCULATING...' : 'RE-CALCULATE RANKING'}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Solar Illumination ({(mcdaWeights.solar_illumination * 100).toFixed(0)}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={mcdaWeights.solar_illumination}
                      onChange={(e) => setMcdaWeights({ ...mcdaWeights, solar_illumination: Number(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Earth Communication ({(mcdaWeights.earth_communication * 100).toFixed(0)}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={mcdaWeights.earth_communication}
                      onChange={(e) => setMcdaWeights({ ...mcdaWeights, earth_communication: Number(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Slope Safety ({(mcdaWeights.slope_safety * 100).toFixed(0)}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={mcdaWeights.slope_safety}
                      onChange={(e) => setMcdaWeights({ ...mcdaWeights, slope_safety: Number(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Elevation Advantage ({(mcdaWeights.elevation_advantage * 100).toFixed(0)}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={mcdaWeights.elevation_advantage}
                      onChange={(e) => setMcdaWeights({ ...mcdaWeights, elevation_advantage: Number(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Ranking Table */}
              {rankingData && rankingData.ranking && (
                <div className="rounded-xl border border-luna-800 bg-luna-900/60 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-luna-800 bg-luna-850/80 font-mono uppercase text-slate-400">
                      <tr>
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Candidate Site</th>
                        <th className="py-3 px-4">Composite Score</th>
                        <th className="py-3 px-4">Illumination %</th>
                        <th className="py-3 px-4">Comm %</th>
                        <th className="py-3 px-4">Slope</th>
                        <th className="py-3 px-4">Evaluation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-luna-800/60">
                      {rankingData.ranking.map((r) => (
                        <tr
                          key={r.site_id}
                          onClick={() => setSelectedSiteId(r.site_id)}
                          className="hover:bg-luna-800/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-cyan-400">#{r.rank}</td>
                          <td className="py-3 px-4 font-medium text-white">{r.name}</td>
                          <td className="py-3 px-4 font-mono font-bold text-amber-300">{r.total_score}</td>
                          <td className="py-3 px-4 font-mono text-slate-300">{r.raw_metrics.illumination_percentage}%</td>
                          <td className="py-3 px-4 font-mono text-slate-300">{r.raw_metrics.communication_percentage}%</td>
                          <td className="py-3 px-4 font-mono text-slate-300">{r.raw_metrics.slope_degrees}°</td>
                          <td className="py-3 px-4 text-[11px] text-slate-400 max-w-xs truncate">{r.explanation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW: POWER SIMULATION */}
          {activeTab === 'simulation' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-luna-800 bg-luna-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
                    <BatteryCharging className="h-4 w-4" />
                    <span>Lander Electrical Power System (EPS) & Battery State of Charge (SoC)</span>
                  </h3>
                  <button
                    onClick={handleRunSimulation}
                    disabled={loading}
                    className="rounded-lg bg-amber-500/20 px-3 py-1.5 font-mono text-xs font-semibold text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
                  >
                    {loading ? 'SIMULATING...' : 'RUN SIMULATION'}
                  </button>
                </div>

                {simulationData && simulationData.time_series ? (
                  <div className="space-y-4">
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={simulationData.time_series}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                          <XAxis
                            dataKey="timestamp"
                            stroke="#64748B"
                            tickFormatter={(t) => new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis stroke="#64748B" unit="%" domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#222E4A', borderRadius: '8px' }}
                            labelFormatter={(t) => new Date(t).toLocaleString()}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line
                            type="monotone"
                            dataKey="battery_soc_percent"
                            name="Battery SoC (%)"
                            stroke="#10B981"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-luna-800 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block">Min Battery SoC:</span>
                        <span className={`text-base font-bold ${simulationData.battery_depleted ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {simulationData.min_battery_soc_percent}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Energy Generated:</span>
                        <span className="text-base font-bold text-amber-300">
                          {simulationData.total_energy_generated_kwh} kWh
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Energy Consumed:</span>
                        <span className="text-base font-bold text-slate-200">
                          {simulationData.total_energy_consumed_kwh} kWh
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Net Balance:</span>
                        <span className={`text-base font-bold ${simulationData.net_energy_balance_kwh >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {simulationData.net_energy_balance_kwh} kWh
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500 font-mono text-xs">
                    Click 'RUN SIMULATION' to simulate battery charge/discharge curve.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
