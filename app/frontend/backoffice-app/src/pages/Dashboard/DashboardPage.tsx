import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../api/analytics';
import { kdsApi } from '../../api/kds';
import type { DashboardData } from '../../api/analytics';
import type { Commande } from '../../types/salle';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Timer,
  ChevronRight,
  BellRing,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  CreditCard,
  ChefHat,
  ChevronLeft
} from 'lucide-react';
import { useSocketStore } from '../../store/socketStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTickets, setActiveTickets] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastUpdate = useSocketStore(state => state.lastUpdate);

  // Pagination state for Alerts
  const [alertPage, setAlertPage] = useState(0);
  const alertsPerPage = 7;

  const fetchData = async () => {
    try {
      const [dashRes, ticketsRes] = await Promise.all([
        analyticsApi.getDashboardData(),
        kdsApi.getActiveTickets()
      ]);
      setData(dashRes.data);
      setActiveTickets(ticketsRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/></div>;
  if (!data) return <div className="text-center py-20 text-on-surface-variant font-sans font-bold uppercase text-[10px]">Registre de données hors ligne.</div>;

  const kpis = [
    { label: "Chiffre d'Affaires", value: `${data.todayRevenue.toFixed(0)} DH`, icon: TrendingUp, trend: "+8.4%", color: "text-primary" },
    { label: "Taux d'Occupation", value: `${Math.round((data.activeTables / 28) * 100)}%`, icon: Users, trend: `${data.activeTables}/28 Tables`, color: "text-primary" },
    { label: "Commandes en Attente", value: data.pendingOrders, icon: ShoppingBag, trend: "Tickets Actifs", color: "text-primary", border: "border-l-4 border-l-primary" },
    { label: "Temps de Prép. Moyen", value: `${data.avgPrepTime}m`, icon: Timer, trend: "+2m retard", color: "text-error" },
  ];

  const groupedTickets = {
    active: activeTickets.filter(t => t.statut === 'EN_COURS' || t.statut === 'EN_CUISINE'),
    ready: activeTickets.filter(t => t.statut === 'PRETE'),
    late: activeTickets.filter(t => {
        const elapsed = (Date.now() - new Date(t.created_at).getTime()) / 60000;
        return (t.statut === 'EN_CUISINE' || t.statut === 'EN_COURS') && elapsed > 20;
    })
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden font-body selection:bg-primary/20 -mt-2">
      
      {/* Tactical KPI Row - Ultra Condensed */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-none">
        {kpis.map((kpi, i) => (
          <div key={i} className={`bg-surface-container p-3 rounded-lg border border-outline-variant flex flex-col gap-1 shadow-sm transition-all hover:bg-surface-container-high ${kpi.border || ''}`}>
            <div className="flex justify-between items-start">
              <span className="font-sans text-[8px] font-black text-on-surface-variant uppercase tracking-widest">{kpi.label}</span>
              <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
            </div>
            <div className="font-serif text-xl font-black text-on-surface tabular-nums">{kpi.value}</div>
            <div className={`font-sans text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${kpi.trend.includes('+') ? 'text-primary' : 'text-on-surface-variant opacity-80'}`}>
              <Activity className="w-2 h-2" /> {kpi.trend}
            </div>
          </div>
        ))}
      </section>

      {/* Main Dashboard Layout - Flex Grow to fill viewport */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 pb-1">
        
        {/* Left Column: Live Feed (4 cols) */}
        <div className="lg:col-span-4 flex flex-col min-h-0">
          
          {/* Live Feed Alerts - Full height */}
          <div className="bg-surface-container border border-outline-variant rounded-lg flex flex-col flex-1 min-h-0 shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-outline-variant bg-surface-container-high flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="font-sans text-[10px] font-black text-on-surface uppercase tracking-[0.2em]">Flux d'Alertes</h3>
                
              </div>
              
              {/* Pagination Controls */}
              {data.liveFeed && data.liveFeed.length > alertsPerPage && (
                <div className="flex items-center gap-2 bg-surface-container-highest/50 px-2 py-0.5 rounded-full border border-outline-variant/30">
                   <button 
                     onClick={() => setAlertPage(p => Math.max(0, p - 1))}
                     disabled={alertPage === 0}
                     className="p-1 text-on-surface-variant hover:text-primary disabled:opacity-20 transition-colors"
                   >
                     <ChevronLeft className="w-3 h-3" />
                   </button>
                   <span className="font-mono text-[9px] font-black text-on-surface-variant">
                      {alertPage + 1}/{Math.ceil(data.liveFeed.length / alertsPerPage)}
                   </span>
                   <button 
                     onClick={() => setAlertPage(p => Math.min(Math.ceil(data.liveFeed!.length / alertsPerPage) - 1, p + 1))}
                     disabled={alertPage >= Math.ceil(data.liveFeed.length / alertsPerPage) - 1}
                     className="p-1 text-on-surface-variant hover:text-primary disabled:opacity-20 transition-colors"
                   >
                     <ChevronRight className="w-3 h-3" />
                   </button>
                </div>
              )}
            </div>
            <div
              className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-2"
              tabIndex={0}
              aria-label="Operational alerts feed"
            >
              {data.liveFeed && data.liveFeed.length > 0 ? data.liveFeed
                .slice(alertPage * alertsPerPage, (alertPage + 1) * alertsPerPage)
                .map((item) => (
                <div key={item.id} className={`p-4 border-l-4 rounded bg-surface-main flex items-start gap-4 transition-all hover:translate-x-1 ${item.type === 'ORDER' ? 'border-primary' : item.type === 'ALERT' ? 'border-error' : 'border-success'}`}>
                   {item.type === 'ORDER' ? <BellRing className="w-5 h-5 mt-0.5 text-primary" /> : item.type === 'ALERT' ? <AlertTriangle className="w-5 h-5 mt-0.5 text-error" /> : <CreditCard className="w-5 h-5 mt-0.5 text-success" />}
                   <div className="min-w-0">
                      <p className="font-sans text-[12px] font-black text-on-surface uppercase tracking-tight leading-tight">{item.message}</p>
                      <p className="font-sans text-[10px] text-on-surface-variant mt-1.5 uppercase tracking-widest opacity-60">
                         {formatDistanceToNow(new Date(item.time), { addSuffix: true, locale: fr })}
                      </p>
                   </div>
                </div>
              )) : (
                <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant/10">
                   <Activity className="w-8 h-8 mb-2" />
                   <p className="font-sans text-[9px] font-black uppercase">Aucune activité</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Tickets Kanban (8 cols) - Flexible height */}
        <div className="lg:col-span-8 bg-surface-container border border-outline-variant rounded-lg flex flex-col min-h-0 shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-high flex justify-between items-center">
            <h3 className="font-sans text-[12px] font-black text-on-surface uppercase tracking-[0.2em]">Orchestration Directe</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/salle')}
                className="h-12 px-8 bg-primary text-on-primary rounded-xl font-sans text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all border border-primary flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Nouveau Ticket
              </button>
            </div>
          </div>
          
          <div
            className="flex-1 p-2 grid grid-cols-3 gap-2 min-h-0 overflow-hidden"
            tabIndex={0}
            aria-label="Live orchestration columns"
          >
            {/* Kanban Columns */}
            {[
              { id: 'active', label: 'Commandes', data: groupedTickets.active, color: 'text-on-surface-variant' },
              { id: 'late', label: 'Retard', data: groupedTickets.late, color: 'text-error' },
              { id: 'ready', label: 'Prêt', data: groupedTickets.ready, color: 'text-primary' }
            ].map(col => (
              <div key={col.id} className="bg-surface-main/50 border border-outline-variant rounded flex flex-col min-h-0 overflow-hidden">
                <h4 className={`font-sans text-[8px] font-black uppercase tracking-widest p-2 flex justify-between items-center bg-surface-container-high/50 ${col.color}`}>
                  {col.label}
                  <span className="bg-surface-container-highest px-1 py-0.5 rounded text-[8px] border border-outline-variant/30">{col.data.length}</span>
                </h4>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-3">
                  {col.data.map(ticket => (
                    <div key={ticket.id} className={`bg-surface-container border p-4 rounded-xl flex flex-col gap-2.5 shadow-md transition-all cursor-pointer ${col.id === 'late' ? 'border-error shadow-error/10' : 'border-outline-variant hover:border-primary'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-sans text-[11px] font-black text-on-surface uppercase tracking-tight">#{ticket.id}</span>
                        <span className="bg-surface-container-highest px-2 py-0.5 rounded text-[9px] font-black border border-outline-variant/50">TBL {ticket.table || '?'}</span>
                      </div>
                      <ul className="font-sans text-[10px] font-bold text-on-surface-variant space-y-1 opacity-80 uppercase tracking-tight">
                        {ticket.lignes.slice(0, 3).map((l, i) => (
                           <li key={i} className="truncate">• {l.quantite}x {l.plat_nom}</li>
                        ))}
                      </ul>
                      <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 pt-2 border-t border-outline-variant/20 ${col.id === 'late' ? 'text-error' : 'text-primary'}`}>
                        {col.id === 'ready' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Timer className="w-3.5 h-3.5" />}
                        <span className="truncate">{col.id === 'ready' ? 'Prêt pour service' : `${Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 60000)}m écoulées`}</span>
                      </div>
                    </div>
                  ))}
                  {col.data.length === 0 && (
                     <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant/5 py-10">
                        <ChefHat className="w-6 h-6 mb-1" />
                        <span className="font-sans text-[8px] font-black uppercase">Vide</span>
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-0 border-t border-outline-variant bg-surface-container-high overflow-hidden">
             <button 
                onClick={() => navigate('/kds')}
                className="w-full h-16 bg-surface-container-highest/30 hover:bg-primary/10 font-sans text-[11px] font-black uppercase tracking-[0.5em] text-primary transition-all flex items-center justify-center gap-4 group"
             >
                Accéder à l'Interface de Commande Complète 
                <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" strokeWidth={3} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
