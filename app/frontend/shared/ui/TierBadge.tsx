import React from 'react';
import { Medal } from 'lucide-react';

interface TierBadgeProps {
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | string;
  className?: string;
  showIcon?: boolean;
}

const TierBadge: React.FC<TierBadgeProps> = ({ tier, className = '', showIcon = true }) => {
  const getTierStyles = () => {
    switch (tier.toUpperCase()) {
      case 'GOLD':
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          text: 'text-amber-700 dark:text-amber-400',
          border: 'border-amber-200 dark:border-amber-800',
          iconColor: '#D97706' // amber-600
        };
      case 'SILVER':
        return {
          bg: 'bg-slate-100 dark:bg-slate-800',
          text: 'text-slate-700 dark:text-slate-400',
          border: 'border-slate-200 dark:border-slate-700',
          iconColor: '#475569' // slate-600
        };
      case 'BRONZE':
      default:
        return {
          bg: 'bg-orange-100 dark:bg-orange-900/30',
          text: 'text-orange-700 dark:text-orange-400',
          border: 'border-orange-200 dark:border-orange-800',
          iconColor: '#EA580C' // orange-600
        };
    }
  };

  const styles = getTierStyles();

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${styles.bg} ${styles.text} ${styles.border} ${className}`}>
      {showIcon && <Medal size={14} color={styles.iconColor} />}
      {tier}
    </div>
  );
};

export default TierBadge;
