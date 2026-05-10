import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState<any[]>([]);
  const { role } = useAuthStore();
  
  // Listen to store updates or direct WS events? 
  // Let's simulate for the UI finish pass or wire to KDS store events
  
  useEffect(() => {
    // In a real app, we'd hook into the WebSocketProvider's events
    // For now, let's keep it as a reactive UI component
  }, []);

  if (role !== 'SERVEUR' && role !== 'GERANT') return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 text-gray-400 hover:text-teal hover:bg-white/5 rounded-xl transition-all relative"
      >
        <Bell className="w-6 h-6" />
        {notifications.length > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-teal rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-4 w-80 bg-dark-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 bg-dark border-b border-white/5 flex items-center justify-between">
            <h4 className="font-bold text-sm tracking-tight text-white uppercase tracking-widest">Alertes Service</h4>
            <button onClick={() => setIsOpen(false)}><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-medium">Tout est servi !</p>
                </div>
            ) : (
                notifications.map((n, i) => (
                    <div key={i} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                        <p className="text-sm font-bold text-white">{n.message}</p>
                        <p className="text-[10px] text-teal font-bold uppercase mt-1">{n.time}</p>
                    </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
