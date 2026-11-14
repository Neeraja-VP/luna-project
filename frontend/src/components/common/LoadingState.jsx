import React from 'react';
import { Compass, Loader2 } from 'lucide-react';

export default function LoadingState({
  title = 'Calculating Orbit & Terrain Models...',
  subtitle = 'Evaluating ephemeris coordinates, LOLA DEM obstruction masks, and line-of-sight vectors.',
  compact = false,
}) {
  if (compact) {
    return (
      <div className="flex items-center justify-center space-x-2 py-4 text-xs font-mono text-cyan-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{title}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-luna-800 bg-luna-900/40 p-10 text-center backdrop-blur-sm">
      <div className="relative mb-4 flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping opacity-75" />
        <div className="absolute inset-1 rounded-full border-2 border-dashed border-cyan-500/40 animate-spin" />
        <Compass className="h-7 w-7 text-cyan-400 animate-pulse" />
      </div>
      <h4 className="font-mono text-sm font-semibold text-slate-200">{title}</h4>
      <p className="mt-1 text-xs text-slate-400 max-w-md">{subtitle}</p>
    </div>
  );
}
