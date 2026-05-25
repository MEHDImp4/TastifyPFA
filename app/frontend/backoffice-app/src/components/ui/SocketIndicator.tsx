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
          color: 'text-primary',
          label: 'SIGNAL DIRECT',
          pulse: false,
          bg: 'bg-primary/5 border-primary/20'
        };
      case 'connecting':
        return {
          icon: Loader2,
          color: 'text-tertiary',
          label: 'SYNCHRONISATION...',
          pulse: true,
          bg: 'bg-surface-container-high border-outline-variant/30'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-error',
          label: 'ERREUR RÉSEAU',
          pulse: false,
          bg: 'bg-error/5 border-error/20'
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-on-surface/30',
          label: 'HORS LIGNE',
          pulse: false,
          bg: 'bg-surface-container-lowest border-outline-variant/10'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2.5 px-3 py-1.5 border rounded-full transition-all duration-300 ${config.bg}`}>
      <Icon strokeWidth={2.5} className={`w-3.5 h-3.5 ${config.color} ${config.pulse ? 'animate-spin' : ''}`} />
      <span className={`font-sans font-black text-[9px] uppercase tracking-[0.2em] ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
};
