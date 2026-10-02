import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'decisionMaker';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  const variantClasses = {
    default: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    warning: 'bg-amber-500/10 text-amber-300 border border-amber-500/25',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
    info: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25',
    decisionMaker: 'bg-amber-400/15 text-amber-300 border border-amber-400/30 font-semibold tracking-wide shadow-sm',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md whitespace-nowrap transition-colors ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export const EmailStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'VALID':
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Valid Email
        </Badge>
      );
    case 'INVALID':
      return (
        <Badge variant="danger">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          Invalid
        </Badge>
      );
    case 'UNKNOWN':
      return (
        <Badge variant="warning">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Unknown / Catch-all
        </Badge>
      );
    default:
      return (
        <Badge variant="default">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          Not Checked
        </Badge>
      );
  }
};
