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
              message: `Rupture critique: ${i.nom} (${i.stock_actuel} ${i.unite_mesure})`,
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

  // Combine and sort notifications
  const allNotifications = [...wsNotifications, ...stockAlerts].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Fermer les alertes opérationnelles' : 'Ouvrir les alertes opérationnelles'}
        title={isOpen ? 'Fermer les alertes opérationnelles' : 'Ouvrir les alertes opérationnelles'}
        className={`p-2 rounded transition-all relative ${isOpen ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'}`}
      >
        <Bell className="w-5 h-5" strokeWidth={1.5}/>
        {allNotifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error border border-background animate-pulse rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-4 w-96 bg-surface-container border border-outline-variant rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-4 bg-surface-container-high border-b border-outline-variant flex items-center justify-between">
            <h4 className="font-sans text-[10px] font-black tracking-[0.25em] text-on-surface uppercase">Alertes Opérationnelles</h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-surface-container-highest rounded-full transition-colors text-on-surface-variant"
            >
              <X className="w-4 h-4" strokeWidth={2.5}/>
            </button>
          </div>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {allNotifications.length === 0 ? (
                <div className="p-12 text-center text-on-surface-variant/40">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20 text-success" strokeWidth={1.5}/>
                    <p className="font-sans text-[10px] font-black uppercase tracking-[0.2em]">Système Nominal</p>
                </div>
            ) : (
                allNotifications.map((n) => {
                    const isWarning = n.type === 'WARNING';
                    const isSuccess = n.type === 'SUCCESS';
                    
                    return (
                        <div key={n.id} className={`p-5 border-b border-outline-variant/30 hover:bg-surface-container-high transition-colors relative group ${isWarning ? 'bg-error/5' : (isSuccess ? 'bg-success/5' : 'bg-transparent')}`}>
                            {!n.id.startsWith('stock-') && (
                                <button 
                                    onClick={() => clearNotification(n.id)}
                                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1 hover:bg-on-surface/10 rounded-full transition-all text-on-surface-variant"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                            <div className="flex items-start gap-3">
                                {isWarning ? <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" /> : (isSuccess ? <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" /> : <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />)}
                                <div>
                                    <p className={`font-sans text-xs font-black leading-tight uppercase ${isWarning ? 'text-error' : (isSuccess ? 'text-success' : 'text-on-surface')}`}>{n.message}</p>
                                    <span className="block mt-2 text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
                                        {new Date(n.timestamp).toLocaleTimeString('fr-FR')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
