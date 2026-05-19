import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { stockApi } from '../../api/inventory_hr';
import { useSocketStore } from '../../store/socketStore';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { role } = useAuthStore();
  const lastUpdate = useSocketStore(state => state.lastUpdate);

  const checkAlerts = async () => {
      try {
          const res = await stockApi.getIngredients();
          const lowStock = res.data.filter(i => parseFloat(i.stock_actuel) <= parseFloat(i.seuil_alerte));
          const alerts = lowStock.map(i => ({
              message: `Stock faible: ${i.nom} (${i.stock_actuel} ${i.unite_mesure})`,
              time: 'Maintenant'
          }));
          setNotifications(alerts);
      } catch (err) {
          console.error(err);
      }
  };

  useEffect(() => {
    checkAlerts();
  }, [lastUpdate]);

  if (role !== 'SERVEUR' && role !== 'GERANT') return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 hover:text-primary hover:bg-surface-container rounded-none transition-all relative"
        style={{ color: '#53443a' }}
      >
        <Bell className="w-6 h-6"  strokeWidth={1.5}/>
        {notifications.length > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-none animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-4 w-80 bg-surface border border-outline-variant/30 rounded-none shadow-[2px_2px_0px_rgba(15,23,42,0.1)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 bg-surface-container border-b border-outline-variant/20 flex items-center justify-between">
            <h4 className="font-bold text-sm uppercase tracking-widest font-mono" style={{ color: '#301400' }}>Alertes de Stock</h4>
            <button onClick={() => setIsOpen(false)}><X className="w-4 h-4" style={{ color: '#53443a' }}  strokeWidth={1.5}/></button>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="p-10 text-center" style={{ color: '#53443a' }}>
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20 text-primary"  strokeWidth={1.5}/>
                    <p className="text-xs font-bold">Tout est en ordre !</p>
                </div>
            ) : (
                notifications.map((n, i) => (
                    <div key={i} className="p-4 border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors cursor-pointer bg-error/5">
                        <p className="text-sm font-bold" style={{ color: '#ba1a1a' }}>{n.message}</p>
                        <p className="text-[10px] font-bold uppercase mt-1" style={{ color: '#53443a' }}>{n.time}</p>
                    </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
