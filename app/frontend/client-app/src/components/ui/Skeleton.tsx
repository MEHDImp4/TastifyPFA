import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div 
      className={`animate-pulse bg-gray-100 rounded-lg ${className}`}
      style={{
        animationDuration: '1.5s',
        backgroundImage: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.02), transparent)',
        backgroundSize: '200% 100%',
        animationName: 'shimmer',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear'
      }}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
    <Skeleton className="aspect-[4/3] w-full rounded-none" />
    <div className="p-8 space-y-4">
      <div className="space-y-2">
        <Skeleton className="w-3/4 h-7" />
        <Skeleton className="w-1/4 h-4" />
      </div>
      <Skeleton className="w-full h-10" />
    </div>
  </div>
);
