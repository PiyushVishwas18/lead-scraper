import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`animate-pulse rounded bg-slate-800/70 border border-slate-700/20 ${className}`}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800/80">
      <div className="flex items-center space-x-4 pb-3 border-b border-slate-800/60">
        <Skeleton className="h-4 w-6 rounded" />
        <Skeleton className="h-4 w-48 rounded" />
        <Skeleton className="h-4 w-36 rounded" />
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-4 w-20 ml-auto rounded" />
      </div>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex items-center space-x-4 py-3">
          <Skeleton className="h-4 w-5 rounded" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-3 w-28 rounded opacity-60" />
          </div>
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-20 rounded opacity-60" />
          </div>
          <Skeleton className="h-6 w-28 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
          <div className="flex items-center space-x-2 ml-auto">
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};
