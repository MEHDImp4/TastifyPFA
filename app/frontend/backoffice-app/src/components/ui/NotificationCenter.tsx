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
        className="p-2 border-2 border-transparent hover:border-on-surface hover:bg-surface-container transition-all relative"
        style={{ color: '#301400' }}
      >
        <Bell className="w-5 h-5"  strokeWidth={2.5}/>
        {notifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error border-2 border-on-surface animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-4 w-96 bg-background border-2 border-on-surface shadow-[8px_8px_0px_#301400] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-4 bg-on-surface text-background flex items-center justify-between">
            <h4 className="text-ui-label-bold text-[10px] tracking-[0.25em]">OPERATIONAL ALERTS</h4>
            <button onClick={() => setIsOpen(false)} className="hover:scale-110 transition-transform"><X className="w-4 h-4"  strokeWidth={2.5}/></button>
          </div>
          <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
            {notifications.length === 0 ? (
                <div className="p-12 text-center" style={{ color: '#53443a' }}>
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-4 opacity-20 text-primary"  strokeWidth={2.5}/>
                    <p className="text-ui-label-bold text-[11px] opacity-40 uppercase tracking-widest">System Nominal</p>
                </div>
            ) : (
                notifications.map((n, i) => (
                    <div key={i} className="p-5 border-b-2 border-on-surface/5 hover:bg-surface-container transition-colors cursor-pointer bg-error/5 group">
                        <p className="text-ui-data-dense font-black text-error leading-tight uppercase group-hover:scale-[1.02] transition-transform">{n.message}</p>
                        <div className="flex items-center justify-between mt-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-50">{n.time.toUpperCase()}</span>
                            <span className="text-[9px] font-black uppercase bg-error text-on-error px-2 py-0.5">Urgent</span>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
