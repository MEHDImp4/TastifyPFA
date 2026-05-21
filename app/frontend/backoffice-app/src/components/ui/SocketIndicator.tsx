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
          color: 'text-secondary',
          label: 'LIVE SIGNAL',
          pulse: false,
          bg: 'bg-background'
        };
      case 'connecting':
        return {
          icon: Loader2,
          color: 'text-primary',
          label: 'SYNCING...',
          pulse: true,
          bg: 'bg-surface-container'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-error',
          label: 'SIGNAL ERR',
          pulse: false,
          bg: 'bg-error-container'
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-on-surface/40',
          label: 'OFFLINE',
          pulse: false,
          bg: 'bg-surface-dim'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-3 px-4 py-2 border-2 border-on-surface shadow-[4px_4px_0px_#301400] transition-all duration-300 ${config.bg}`}>
      <Icon strokeWidth={2.5} className={`w-4 h-4 ${config.color} ${config.pulse ? 'animate-spin' : ''}`} />
      <span className={`text-ui-label-bold text-[9px] ${config.color}`}>
        {config.label}
      </span>
      {status === 'connected' && (
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
        </span>
      )}
    </div>
  );
};
