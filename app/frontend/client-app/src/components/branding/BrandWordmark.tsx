import React from 'react';
import { useConfigStore } from '../../store/configStore';

export const DEFAULT_BRAND_NAME = 'Tastify';

export const getBrandName = (name?: string | null) => {
  const trimmed = name?.trim();
  return trimmed || DEFAULT_BRAND_NAME;
};

interface BrandWordmarkProps {
  className?: string;
  style?: React.CSSProperties;
}

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({ className, style }) => {
  const config = useConfigStore(state => state.config);

  return <span className={className} style={style}>{getBrandName(config?.nom)}</span>;
};
