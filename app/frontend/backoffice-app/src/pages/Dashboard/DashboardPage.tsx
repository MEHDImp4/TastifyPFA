import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../api/analytics';
import { kdsApi } from '../../api/kds';
import type { DashboardData } from '../../api/analytics';
import type { Commande } from '../../types/salle';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Timer,
  ChevronRight,
  BellRing,
  Activity,
  Maximize2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Smile,
  Meh,
  Frown,
  CreditCard,
  ChefHat
} from 'lucide-react';
import { useSocketStore } from '../../store/socketStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTickets, setActiveTickets] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastUpdate = useSocketStore(state => state.lastUpdate);

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
    
    // Auto-refresh every 30s to update "elapsed time" counters and as a backup to WebSockets
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/></div>;
  if (!data) return <div className="text-center py-20 text-on-surface-variant font-sans font-bold uppercase text-[10px]">Registre de données hors ligne.</div>;

  const kpis = [
    { label: "Chiffre d'Affaires", value: `${data.todayRevenue.toFixed(0)} DH`, icon: TrendingUp, trend: "+8.4%", color: "text-primary" },
    { label: "Taux d'Occupation", value: `${Math.round((data.activeTables / 28) * 100)}%`, icon: Users, trend: "24/28 Tables", color: "text-primary" },
    { label: "Commandes en Attente", value: data.pendingOrders, icon: ShoppingBag, trend: "3 Priorités", color: "text-primary", border: "border-l-4 border-l-primary" },
    { label: "Temps de Prép. Moyen", value: `${data.avgPrepTime}m`, icon: Timer, trend: "+2m retard", color: "text-error" },
  ];

  // Logic for Kanban grouping
  const groupedTickets = {
    prep: activeTickets.filter(t => t.statut === 'EN_CUISINE'),
    ready: activeTickets.filter(t => t.statut === 'PRETE'),
    late: activeTickets.filter(t => {
        if (t.statut !== 'EN_CUISINE') return false;
        const elapsed = (Date.now() - new Date(t.created_at).getTime()) / 60000;
        return elapsed > 20; // Hardcoded threshold for late
    })
  };

  return (
    <div className="space-y-staff-margin font-body -m-staff-margin p-staff-margin bg-surface-container-lowest min-h-screen selection:bg-primary/20">
      
      {/* Tactical KPI Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-unit-md">
        {kpis.map((kpi, i) => (
          <div key={i} className={`bg-surface-container p-6 rounded-lg border border-outline-variant flex flex-col gap-2 shadow-sm transition-all hover:bg-surface-container-high ${kpi.border || ''}`}>
            <div className="flex justify-between items-start">
              <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{kpi.label}</span>
              <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} />
            </div>
            <div className="font-serif text-3xl font-black text-on-surface tabular-nums">{kpi.value}</div>
            <div className={`font-sans text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${kpi.trend.includes('+') ? 'text-primary' : 'text-on-surface-variant opacity-80'}`}>
              <Activity className="w-3 h-3" /> {kpi.trend}
            </div>
          </div>
        ))}
      </section>

      {/* Sentiment Analysis KPI */}
      {data.sentimentStats && data.sentimentStats.total > 0 && (
        <section className="bg-surface-container border border-outline-variant rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em]">Analyse de Sentiment Client</h3>
              <p className="font-sans text-[10px] text-on-surface-variant mt-0.5 uppercase tracking-widest opacity-60">{data.sentimentStats.total} avis analysés par l'IA</p>
            </div>
            <Activity className="w-5 h-5 text-on-surface-variant/30" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center gap-2 p-4 bg-surface-main rounded-lg border border-outline-variant">
              <Smile className="w-6 h-6 text-primary" />
              <span className="font-serif text-2xl font-black text-on-surface tabular-nums">{data.sentimentStats.positif_pct}%</span>
              <span className="font-sans text-[9px] font-black text-primary uppercase tracking-widest">Positif</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-surface-main rounded-lg border border-outline-variant">
              <Meh className="w-6 h-6 text-on-surface-variant/50" />
              <span className="font-serif text-2xl font-black text-on-surface tabular-nums">{data.sentimentStats.neutre_pct}%</span>
              <span className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Neutre</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-surface-main rounded-lg border border-outline-variant">
              <Frown className="w-6 h-6 text-error" />
              <span className="font-serif text-2xl font-black text-on-surface tabular-nums">{data.sentimentStats.negatif_pct}%</span>
              <span className="font-sans text-[9px] font-black text-error uppercase tracking-widest">Négatif</span>
            </div>
          </div>
        </section>
      )}

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-staff-gutter flex-1">
        
        {/* Left Column: Live Feed & Map (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-staff-gutter h-full">
          
          {/* Live Feed Alerts */}
          <div className="bg-surface-container border border-outline-variant rounded-lg flex flex-col flex-1 min-h-[350px] shadow-sm">
            <div className="p-4 border-b border-outline-variant bg-surface-container-high flex justify-between items-center rounded-t-lg">
              <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em]">Flux d'Alertes Direct</h3>
              <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
            </div>
            <div
              className="p-unit-sm flex flex-col gap-2 overflow-y-auto custom-scrollbar"
              tabIndex={0}
              aria-label="Operational alerts feed"
            >
              {data.liveFeed && data.liveFeed.length > 0 ? data.liveFeed.map((item) => (
                <div key={item.id} className={`p-4 border-l-4 rounded bg-surface-main flex items-start gap-4 transition-all hover:translate-x-1 ${item.type === 'ORDER' ? 'border-primary' : item.type === 'ALERT' ? 'border-error' : 'border-success'}`}>
                   {item.type === 'ORDER' ? <BellRing className="w-4 h-4 mt-0.5 text-primary" /> : item.type === 'ALERT' ? <AlertTriangle className="w-4 h-4 mt-0.5 text-error" /> : <CreditCard className="w-4 h-4 mt-0.5 text-success" />}
                   <div>
                      <p className="font-sans text-[12px] font-black text-on-surface uppercase tracking-tight leading-none">{item.message}</p>
                      <p className="font-sans text-[10px] text-on-surface-variant mt-1.5 uppercase tracking-widest">
                         {formatDistanceToNow(new Date(item.time), { addSuffix: true, locale: fr })}
                      </p>
                   </div>
                </div>
              )) : (
                <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant/20 p-10">
                   <Activity className="w-12 h-12 mb-2" />
                   <p className="font-sans text-[10px] font-black uppercase">Aucune activité récente</p>
                </div>
              )}
            </div>
          </div>

          {/* Floor Plan Preview */}
          <div className="bg-surface-container border border-outline-variant rounded-lg flex flex-col h-[280px] shadow-sm">
            <div className="p-4 border-b border-outline-variant bg-surface-container-high flex justify-between items-center rounded-t-lg">
              <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em]">Aperçu Plan de Salle</h3>
              <button
                type="button"
                aria-label="Agrandir aperçu plan de salle"
                title="Agrandir aperçu plan de salle"
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="sr-only">Agrandir aperçu plan de salle</span>
              </button>
            </div>
            <div className="flex-1 p-4 bg-surface-main relative flex items-center justify-center overflow-hidden rounded-b-lg blueprint-grid">
              <div className="w-full h-full border border-dashed border-outline-variant/30 relative p-4 opacity-40">
                <div className="absolute top-4 left-4 w-10 h-10 rounded border-2 border-error bg-error/10" />
                <div className="absolute top-4 right-4 w-10 h-10 rounded border-2 border-primary bg-primary/10" />
                <div className="absolute bottom-4 left-4 w-16 h-10 rounded-full border-2 border-outline-variant bg-surface-container-highest" />
                <div className="absolute bottom-4 right-4 w-12 h-12 rounded border-2 border-outline-variant bg-surface-container-highest" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-on-surface-variant font-sans text-[9px] font-black uppercase tracking-[0.4em] text-center">Zone Alpha</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Tickets Kanban (8 cols) */}
        <div className="lg:col-span-8 bg-surface-container border border-outline-variant rounded-lg flex flex-col min-h-[650px] shadow-2xl">
          <div className="p-4 border-b border-outline-variant bg-surface-container-high flex justify-between items-center rounded-t-lg">
            <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em]">Flux d'Orchestration en Direct</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 border border-outline-variant rounded font-sans text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-highest">Filtrer</button>
              <button className="px-4 py-1.5 bg-primary text-on-primary rounded font-sans text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Nouveau Ticket</button>
            </div>
          </div>
          
          <div
            className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto custom-scrollbar"
            tabIndex={0}
            aria-label="Live orchestration columns"
            role="region"
          >
            {/* Kanban Columns */}
            {[
              { id: 'prep', label: 'En Préparation', data: groupedTickets.prep, color: 'text-on-surface-variant' },
              { id: 'late', label: 'En Retard', data: groupedTickets.late, color: 'text-error' },
              { id: 'ready', label: 'Prêt', data: groupedTickets.ready, color: 'text-primary' }
            ].map(col => (
              <div key={col.id} className="bg-surface-main/50 border border-outline-variant rounded flex flex-col p-3 min-w-[240px]">
                <h4 className={`font-sans text-[11px] font-black uppercase tracking-widest mb-4 px-1 flex justify-between items-center ${col.color}`}>
                  {col.label}
                  <span className="bg-surface-container-highest px-2 py-0.5 rounded text-[10px] border border-outline-variant/30">{col.data.length}</span>
                </h4>
                <div className="flex flex-col gap-3">
                  {col.data.map(ticket => (
                    <div key={ticket.id} className={`bg-surface-container border p-4 rounded flex flex-col gap-3 shadow-sm transition-all cursor-pointer ${col.id === 'late' ? 'border-error shadow-error/5' : 'border-outline-variant hover:border-primary'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-sans text-xs font-black text-on-surface uppercase tracking-tight">#CMD-{ticket.id}</span>
                        <span className="bg-surface-container-highest px-2 py-0.5 rounded text-[9px] font-black border border-outline-variant/50">TBL {ticket.table || '??'}</span>
                      </div>
                      <ul className="font-sans text-[11px] font-bold text-on-surface-variant space-y-1 opacity-80 uppercase tracking-tight">
                        {ticket.lignes.map((l, i) => (
                           <li key={i}>• {l.quantite}x {l.plat_nom}</li>
                        ))}
                      </ul>
                      <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 pt-2 border-t border-outline-variant/20 ${col.id === 'late' ? 'text-error' : 'text-primary'}`}>
                        {col.id === 'ready' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Timer className="w-3.5 h-3.5" />}
                        {col.id === 'ready' ? 'En attente de retrait' : `${Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 60000)}m écoulées`}
                      </div>
                    </div>
                  ))}
                  {col.data.length === 0 && (
                     <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant/10">
                        <ChefHat className="w-8 h-8 mb-2" />
                        <span className="font-sans text-[9px] font-black uppercase tracking-widest">Vide</span>
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-outline-variant bg-surface-container-high flex justify-center rounded-b-lg">
             <button className="font-sans text-[10px] font-black uppercase tracking-[0.4em] text-primary hover:text-on-surface transition-all flex items-center gap-2">
                Accéder à l'Interface de Commande Complète <ChevronRight className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
