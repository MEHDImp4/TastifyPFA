import React from 'react';
import { useConfigStore } from '../../store/configStore';

export const DEFAULT_BRAND_NAME = 'Tastify';

export const getBrandName = (name?: string | null) => {
  const trimmed = name?.trim();
  return trimmed || DEFAULT_BRAND_NAME;
};

interface BrandWordmarkProps {
  className?: string;
}

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({ className }) => {
  const config = useConfigStore(state => state.config);

  return <span className={className}>{getBrandName(config?.nom)}</span>;
};
