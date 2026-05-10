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
          color: 'text-teal',
          label: 'Connecté',
          pulse: false,
        };
      case 'connecting':
        return {
          icon: Loader2,
          color: 'text-amber',
          label: 'Connexion...',
          pulse: true,
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-terracotta',
          label: 'Erreur',
          pulse: false,
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-gray-500',
          label: 'Déconnecté',
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-elevated border border-white/5 shadow-sm transition-all duration-300`}>
      <Icon className={`w-3.5 h-3.5 ${config.color} ${config.pulse ? 'animate-spin' : ''}`} />
      <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
        {config.label}
      </span>
      {status === 'connected' && (
        <span className="flex h-1.5 w-1.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal"></span>
        </span>
      )}
    </div>
  );
};
