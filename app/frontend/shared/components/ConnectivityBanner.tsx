import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const ConnectivityBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] animate-fade-up">
      <div className="bg-red-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-red-400/20">
        <div className="bg-white/20 p-2 rounded-xl">
          <WifiOff size={20} className="animate-pulse" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">Mode Hors-ligne</p>
          <p className="text-xs text-red-50/80">Connexion perdue. Certaines fonctionnalités sont limitées.</p>
        </div>
      </div>
    </div>
  );
};
