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
import { fr } from 'date-fns/locale/fr';

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

  if (isLoading || !data) return (
    <div className="h-full flex items-center justify-center text-primary bg-surface-container-lowest rounded-lg border border-outline-variant">
      <Loader2 className="w-10 h-10 animate-spin" />
    </div>
  );

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

      {/* Main Content Area - Split Panel */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        
        {/* Left: Alerts and Notifications (4 cols) */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-3 min-h-0">
          <div className="bg-surface-container rounded-lg border border-outline-variant p-4 flex flex-col min-h-0 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-3 flex-none">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-primary" />
                <h3 className="font-sans text-[10px] font-black text-on-surface uppercase tracking-[0.2em]">Flux d'Alertes Prioritaires</h3>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setAlertPage(prev => Math.max(0, prev - 1))}
                  disabled={alertPage === 0}
                  className="p-1 hover:bg-surface-container-high rounded disabled:opacity-20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setAlertPage(prev => prev + 1)}
                  className="p-1 hover:bg-surface-container-high rounded"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1 flex-1 scrollbar-thin scrollbar-thumb-outline">
              {groupedTickets.late.length > 0 ? (
                groupedTickets.late.slice(alertPage * alertsPerPage, (alertPage + 1) * alertsPerPage).map((t, i) => (
                  <div key={i} className="bg-surface-main p-3 rounded border-l-4 border-l-error border-outline-variant flex flex-col gap-1.5 animate-in slide-in-from-left duration-300">
                    <div className="flex justify-between items-center">
                      <span className="font-sans text-[10px] font-bold text-error uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Retard Critique
                      </span>
                      <span className="font-sans text-[8px] font-black text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded">T{t.table}</span>
                    </div>
                    <p className="font-serif text-sm font-black text-on-surface leading-tight">Table {t.table} attend depuis {Math.round((Date.now() - new Date(t.created_at).getTime())/60000)}m</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-on-surface-variant font-medium">Ticket #{t.id.toString().slice(-4)}</span>
                      <button className="text-[9px] font-black text-primary uppercase tracking-tighter hover:underline">Intervenir</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 gap-3 grayscale">
                  <CheckCircle2 className="w-12 h-12 text-primary" strokeWidth={1} />
                  <p className="font-sans text-[10px] font-black uppercase tracking-widest">Aucun retard détecté</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface-container rounded-lg border border-outline-variant p-4 flex-none shadow-sm">
            <h3 className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-3">Statut Système</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-surface-main rounded border border-outline-variant/50">
                <span className="text-[10px] font-bold text-on-surface-variant">WS.ORCHESTRATOR</span>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                   <span className="text-[9px] font-black text-primary uppercase">Connecté</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Operational Kanban (8 cols) */}
        <section className="col-span-12 lg:col-span-8 bg-surface-container rounded-lg border border-outline-variant flex flex-col min-h-0 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex items-center justify-between flex-none bg-surface-container-high/30">
             <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" />
                <h3 className="font-sans text-[10px] font-black text-on-surface uppercase tracking-[0.2em]">Tickets Actifs en Cuisine</h3>
             </div>
             <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-primary" />
                   <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">{groupedTickets.active.length} En cours</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-secondary" />
                   <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">{groupedTickets.ready.length} Prêts</span>
                </div>
             </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 content-start scrollbar-thin scrollbar-thumb-outline">
            {activeTickets.length > 0 ? (
              activeTickets.map((ticket, i) => (
                <div 
                  key={i} 
                  className={`bg-surface-main rounded-lg border border-outline-variant p-3 flex flex-col gap-3 shadow-sm hover:border-primary/50 transition-colors group cursor-pointer ${ticket.statut === 'PRETE' ? 'bg-secondary/5 border-secondary/30' : ''}`}
                  onClick={() => navigate('/commandes')}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-sans text-[8px] font-black text-on-surface-variant uppercase tracking-tighter opacity-60">Ticket #{ticket.id.toString().slice(-4)}</span>
                      <span className="font-serif text-lg font-black text-on-surface">Table {ticket.table}</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                      ticket.statut === 'PRETE' ? 'bg-secondary text-on-secondary' : 'bg-primary text-on-primary'
                    }`}>
                      {ticket.statut.replace('_', ' ')}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {ticket.lignes?.slice(0, 3).map((item, j) => (
                      <span key={j} className="text-[9px] font-bold bg-surface-container-high px-2 py-0.5 rounded text-on-surface border border-outline-variant/30">
                        {item.quantite}x {item.plat_nom}
                      </span>
                    ))}
                    {(ticket.lignes?.length || 0) > 3 && (
                      <span className="text-[9px] font-bold text-on-surface-variant opacity-60 px-1">+{(ticket.lignes?.length || 0) - 3}</span>
                    )}
                  </div>

                  <div className="mt-auto pt-3 border-t border-outline-variant/30 flex justify-between items-center">
                    <div className="flex items-center gap-1 text-on-surface-variant">
                      <Timer className="w-3 h-3" />
                      <span className="text-[9px] font-bold">
                        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <CreditCard className="w-3.5 h-3.5 text-on-surface-variant/40" />
                       <ChefHat className="w-3.5 h-3.5 text-on-surface-variant/40" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full h-40 flex flex-col items-center justify-center text-center opacity-30 gap-2 grayscale">
                <ShoppingBag className="w-8 h-8" strokeWidth={1.5} />
                <p className="font-sans text-[10px] font-black uppercase tracking-widest">Aucun ticket actif</p>
              </div>
            )}
          </div>
        </section>
      </div>

    </div>
  );
};
