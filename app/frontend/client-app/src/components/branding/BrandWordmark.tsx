import React from 'react';
import { useConfigStore } from '../../store/configStore';
import { getBrandName } from './brandName';

interface BrandWordmarkProps {
  className?: string;
  style?: React.CSSProperties;
}

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({ className, style }) => {
  const config = useConfigStore(state => state.config);

  return <span className={className} style={style}>{getBrandName(config?.nom)}</span>;
};
