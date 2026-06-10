import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { stockApi } from '../../api/inventory_hr';
import { useSocketStore } from '../../store/socketStore';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const { role } = useAuthStore();
  const lastUpdate = useSocketStore(state => state.lastUpdate);
  const wsNotifications = useSocketStore(state => state.notifications);
  const clearNotification = useSocketStore(state => state.clearNotification);

  const checkAlerts = async () => {
      try {
          const res = await stockApi.getIngredients();
          const lowStock = res.data.filter(i => parseFloat(i.stock_actuel) <= parseFloat(i.seuil_alerte));
          const alerts = lowStock.map(i => ({
              id: `stock-${i.id}`,
              message: `Stock bas : ${i.nom} (${i.stock_actuel} ${i.unite_mesure})`,
              type: 'WARNING',
              timestamp: new Date()
          }));
          setStockAlerts(alerts);
      } catch (err) {
          console.error(err);
      }
  };

  useEffect(() => {
    checkAlerts();
  }, [lastUpdate]);

  if (role !== 'SERVEUR' && role !== 'GERANT' && role !== 'CUISINIER') return null;

  const allNotifications = [...wsNotifications, ...stockAlerts].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Centre de notifications"
        className={`p-2 rounded transition-all relative ${isOpen ? 'bg-on-background/5 text-on-background' : 'text-on-surface-variant hover:text-on-background hover:bg-surface-container-low'}`}
      >
        <Bell className="w-5 h-5" strokeWidth={1.5}/>
        {allNotifications.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border border-background" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-80 bg-surface border border-outline rounded-md z-[100] shadow-2xl">
          <div className="p-4 border-b border-outline bg-surface-container-high flex items-center justify-between">
            <h4 className="text-[10px] font-bold tracking-widest text-on-background uppercase">Alertes opérationnelles</h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer le centre de notifications"
              className="p-1 hover:bg-background rounded transition-colors text-on-surface-variant"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2}/>
            </button>
          </div>
          <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
            {allNotifications.length === 0 ? (
                <div className="p-10 text-center text-on-surface-variant/40">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20" strokeWidth={1}/>
                    <p className="text-[9px] font-bold uppercase tracking-widest">Aucune alerte</p>
                </div>
            ) : (
                allNotifications.map((n) => {
                    const isWarning = n.type === 'WARNING';
                    return (
                        <div key={n.id} className={`p-4 border-b border-outline hover:bg-background/50 transition-colors relative group ${isWarning ? 'bg-error/[0.02]' : ''}`}>
                            {!n.id.startsWith('stock-') && (
                                <button
                                    onClick={() => clearNotification(n.id)}
                                    aria-label="Masquer la notification"
                                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded transition-all"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                            <div className="flex items-start gap-3">
                                {isWarning ? <AlertTriangle className="w-4 h-4 text-error shrink-0" /> : <Info className="w-4 h-4 text-on-surface-variant shrink-0" />}
                                <div>
                                    <p className={`text-[11px] font-bold leading-tight uppercase ${isWarning ? 'text-error' : 'text-on-background'}`}>{n.message}</p>
                                    <span className="block mt-1.5 text-[8px] font-bold uppercase tracking-widest text-on-surface-variant opacity-40">
                                        {new Date(n.timestamp).toLocaleTimeString('fr-FR')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
          </div>
          {allNotifications.length > 0 && (
             <div className="p-3 bg-surface-container-high border-t border-outline text-center">
                <button 
                   onClick={() => setIsOpen(false)}
                   className="text-[9px] font-bold uppercase tracking-[0.2em] text-on-surface-variant hover:text-on-background transition-colors"
                >
                   Fermer le panneau
                </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

