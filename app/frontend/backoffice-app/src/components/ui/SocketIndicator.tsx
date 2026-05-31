import React from 'react';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { useSocketStore } from '../../store/socketStore';

export const SocketIndicator: React.FC = () => {
  const { status } = useSocketStore();

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-success',
          label: 'Direct',
          bg: 'bg-surface border-outline'
        };
      case 'connecting':
        return {
          icon: Loader2,
          color: 'text-on-surface-variant',
          label: 'Sync...',
          bg: 'bg-surface-container-high border-outline'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-error',
          label: 'Erreur',
          bg: 'bg-error/[0.02] border-error/20'
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-on-surface-variant',
          label: 'Off',
          bg: 'bg-background border-outline'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1 border rounded transition-all ${config.bg}`}>
      <Icon strokeWidth={2} className={`w-3.5 h-3.5 ${config.color} ${status === 'connecting' ? 'animate-spin' : ''}`} />
      <span className={`text-[9px] font-bold uppercase tracking-widest ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
};

