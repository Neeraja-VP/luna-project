import React from 'react';

/**
 * Reusable Scientific Telemetry Metric Card
 */
export default function MetricCard({
  label,
  value,
  unit = '',
  sublabel,
  icon: Icon,
  status = 'neutral', // 'solar' | 'earth' | 'success' | 'danger' | 'warning' | 'neutral'
  className = '',
  loading = false,
}) {
  const statusStyles = {
    solar: 'border-amber-500/30 bg-amber-500/5 text-amber-300',
    earth: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300',
    success: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
    danger: 'border-rose-500/30 bg-rose-500/5 text-rose-300',
    warning: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-300',
    neutral: 'border-luna-800 bg-luna-900/60 text-slate-200',
  };

  const labelStyles = {
    solar: 'text-amber-400/80',
    earth: 'text-cyan-400/80',
    success: 'text-emerald-400/80',
    danger: 'text-rose-400/80',
    warning: 'text-yellow-400/80',
    neutral: 'text-slate-400',
  };

  const iconStyles = {
    solar: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    earth: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    danger: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    neutral: 'text-slate-400 bg-slate-800/40 border-slate-700/50',
  };

  return (
    <div
      className={`rounded-xl border p-4 backdrop-blur-sm transition-all hover:border-slate-600/60 shadow-sm ${
        statusStyles[status] || statusStyles.neutral
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className={`text-[11px] font-mono uppercase tracking-wider font-semibold block ${labelStyles[status]}`}>
            {label}
          </span>
          <div className="flex items-baseline space-x-1">
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded bg-slate-800/80 my-0.5" />
            ) : (
              <>
                <span className="font-mono text-2xl font-bold tracking-tight">
                  {value !== null && value !== undefined ? value : '—'}
                </span>
                {unit && <span className="font-mono text-xs opacity-80">{unit}</span>}
              </>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${iconStyles[status]}`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>

      {sublabel && (
        <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
          <span>{sublabel}</span>
        </div>
      )}
    </div>
  );
}
