import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div 
      className={`animate-pulse bg-surface-container-high rounded-xl ${className}`}
      style={{
        animationDuration: '2s',
        backgroundImage: 'linear-gradient(90deg, transparent, rgba(0,64,224,0.03), transparent)',
        backgroundSize: '200% 100%',
        animationName: 'shimmer',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear'
      }}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-surface-container border border-outline-variant rounded-3xl overflow-hidden shadow-xl p-4">
    <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        <Skeleton className="w-3/4 h-8" />
        <Skeleton className="w-1/2 h-4" />
      </div>
      <Skeleton className="w-full h-12" />
    </div>
  </div>
);
