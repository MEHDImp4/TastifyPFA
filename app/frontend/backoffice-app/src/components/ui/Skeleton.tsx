import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div 
      className={`animate-pulse bg-on-background/5 rounded-2xl ${className}`}
      style={{
        animationDuration: '1.5s',
        backgroundImage: 'linear-gradient(90deg, transparent, rgba(17,17,17,0.05), transparent)',
        backgroundSize: '200% 100%',
        animationName: 'shimmer',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear'
      }}
    />
  );
};

export const KpiSkeleton: React.FC = () => (
  <div className="p-6 bg-surface rounded-lg border border-outline space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <Skeleton className="w-12 h-4" />
    </div>
    <div className="space-y-2">
      <Skeleton className="w-24 h-8" />
      <Skeleton className="w-16 h-4" />
    </div>
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-surface rounded-lg border border-outline overflow-hidden">
    <Skeleton className="aspect-[4/3] w-full rounded-xl" />
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton className="w-3/4 h-6" />
          <Skeleton className="w-1/2 h-4" />
        </div>
        <Skeleton className="w-16 h-8 rounded-xl" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-10 h-10 rounded-xl" />
      </div>
    </div>
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-4 border-b border-outline">
    <div className="flex items-center gap-4 flex-1">
      <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="w-1/3 h-5" />
        <Skeleton className="w-1/4 h-4" />
      </div>
    </div>
    <div className="flex items-center gap-8 flex-1 justify-center">
      <Skeleton className="w-20 h-4" />
      <Skeleton className="w-24 h-4" />
    </div>
    <div className="flex items-center gap-2">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <Skeleton className="w-10 h-10 rounded-xl" />
    </div>
  </div>
);
