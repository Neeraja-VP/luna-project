import React from 'react';

export default function Badge({
  children,
  variant = 'default', // 'default' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'purple'
  size = 'sm',
  className = '',
}) {
  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700/60',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    purple: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  };

  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono font-medium ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size] || sizeStyles.sm} ${className}`}
    >
      {children}
    </span>
  );
}
