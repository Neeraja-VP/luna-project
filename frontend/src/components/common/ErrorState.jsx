import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  title = 'Calculation / Telemetry Failure',
  message = 'Failed to retrieve telemetry or orbital calculations from backend.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/30 bg-rose-950/20 p-8 text-center backdrop-blur-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-3">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h4 className="font-mono text-sm font-bold text-rose-300">{title}</h4>
      <p className="mt-1 text-xs text-rose-200/80 max-w-lg font-mono">{message}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center space-x-1.5 rounded-lg border border-rose-500/40 bg-rose-500/20 px-3.5 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30 transition-all shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>RETRY CALCULATION</span>
        </button>
      )}
    </div>
  );
}
