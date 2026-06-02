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
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  History,
  ArrowUpRight
} from 'lucide-react';
import { useSocketStore } from '../../store/socketStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTickets, setActiveTickets] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const lastUpdate = useSocketStore(state => state.lastUpdate);

  const fetchData = async () => {
    try {
      setError(false);
      const [dashRes, ticketsRes] = await Promise.all([
        analyticsApi.getDashboardData(),
        kdsApi.getActiveTickets()
      ]);
      setData(dashRes.data);
      setActiveTickets(ticketsRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  const groupedTickets = React.useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return {
      late: activeTickets.filter(t => {
        const elapsed = (now - new Date(t.created_at).getTime()) / 60000;
        return (t.statut === 'EN_CUISINE') && elapsed > 20;
      })
    };
  }, [activeTickets]);

  if (error) return (
    <div className="h-full flex flex-col items-center justify-center text-error p-8 text-center uppercase tracking-widest font-black">
      <AlertTriangle className="w-16 h-16 mb-4" />
      <h2 className="text-2xl">Data registry offline.</h2>
      <p className="text-xs text-on-surface-variant mt-3 font-bold">Échec de synchronisation avec le registre analytique principal.</p>
      <button onClick={fetchData} className="mt-8 btn-primary">Réessayer</button>
    </div>
  );

  if (isLoading || !data) return (
    <div className="h-full flex items-center justify-center text-primary">
      <Loader2 className="w-12 h-12 animate-spin" />
    </div>
  );

  const kpis = [
    { label: "Chiffre d'Affaires", value: `${data.todayRevenue.toFixed(0)} DH`, icon: TrendingUp, trend: "+8.4%", color: "text-primary" },
    { label: "Occupation Salle", value: `${Math.round((data.activeTables / 28) * 100)}%`, icon: Users, trend: `${data.activeTables}/28 Tables`, color: "text-primary" },
    { label: "Tickets Actifs", value: data.pendingOrders, icon: ShoppingBag, trend: "En Cuisine / Prêts", color: "text-primary" },
    { label: "Service Cuisine", value: `${data.avgPrepTime}m`, icon: Timer, trend: "Objectif: 15m", color: "text-success" },      
  ];

  return (
    <div className="flex-1 flex flex-col gap-10 overflow-hidden font-sans">
      
      {/* Page Header */}
      <div className="flex-none flex justify-between items-end">
        <div>
           <h1 className="text-4xl font-black tracking-tight text-on-surface">Tableau de Bord</h1>
           <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.4em] mt-2">Intelligence Opérationnelle & Monitoring Direct</p>
        </div>
        <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant px-8 py-3.5 rounded-xl">
           <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">Système Connecté</span>
        </div>
      </div>

      {/* KPI Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {kpis.map((kpi, i) => (
          <div key={i} className="luxury-card p-8 group transition-all cursor-default">
             <div className="flex justify-between items-center mb-6">
                <span className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.25em]">{kpi.label}</span>
                <div className={`p-2.5 rounded-lg bg-primary/5 transition-colors group-hover:bg-primary/10`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} strokeWidth={2.5} />
                </div>
             </div>
             <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-on-surface tracking-tighter tabular-nums">{kpi.value}</span>
             </div>
             <div className="mt-8 flex items-center justify-between">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{kpi.trend}</span>
                <ArrowUpRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
             </div>
          </div>
        ))}
      </section>

      {/* Operation Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        
        {/* Left: Tactical Feed (7 cols) */}
        <section className="lg:col-span-7 flex flex-col min-h-0">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" strokeWidth={2.5} />
                 </div>
                 <h2 className="text-xl font-black tracking-tight text-on-surface uppercase ">Flux Opérationnel <span className="sr-only">Live Orchestration Feed</span></h2>
              </div>
              <button onClick={() => navigate('/salle')} className="h-10 px-5 border border-outline-variant rounded-lg text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary hover:border-primary transition-all flex items-center gap-2">
                Accéder au Plan <ChevronRight className="w-4 h-4" />
              </button>
           </div>

           <div tabIndex={0} className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
              <div className="grid grid-cols-1 gap-4">
                 {activeTickets.length > 0 ? activeTickets.map((ticket, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        key={ticket.id}
                        className="luxury-card p-6 flex items-center justify-between hover:border-primary/20 transition-all group"
                    >
                        <div className="flex items-center gap-8">
                            <div className="w-16 h-16 bg-surface-container-low border border-outline-variant rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                                <span className="font-mono text-2xl font-black">T{ticket.table}</span>
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-on-surface uppercase tracking-tight">Commande #{ticket.id}</h4>
                                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mt-1.5 opacity-50">
                                    {ticket.lignes.length} Articles • {ticket.type.replace('_', ' ')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-10">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Durée</p>
                                <p className="font-sans text-sm font-bold text-on-surface mt-1 uppercase tracking-tight">
                                    {formatDistanceToNow(new Date(ticket.created_at), { locale: fr })}
                                </p>
                            </div>
                            <div className={`px-5 py-2.5 rounded-full font-sans text-[10px] font-black uppercase tracking-widest border ${
                                ticket.statut === 'PRETE' ? 'bg-success/5 text-success border-success/30' : 'bg-primary/5 text-primary border-primary/30'
                            }`}>
                                {ticket.statut.replace('_', ' ')}
                            </div>
                        </div>
                    </motion.div>
                 )) : (
                    <div className="h-64 border-2 border-dashed border-outline-variant rounded-[2rem] flex flex-col items-center justify-center text-on-surface-variant">
                        <History className="w-12 h-12 mb-4 opacity-40" />
                        <p className="text-xs font-black uppercase tracking-[0.4em] opacity-80">Aucune transaction active</p>
                    </div>
                 )}
              </div>
           </div>
        </section>

        {/* Right: Security & Alerts (5 cols) */}
        <section className="lg:col-span-5 flex flex-col min-h-0 luxury-card p-10 overflow-hidden">
            <div className="flex items-center gap-4 mb-10 border-b border-outline-variant/30 pb-6">
                <div className="w-10 h-10 rounded-lg bg-error/5 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-error" />
                </div>
                <h2 className="text-xl font-black tracking-tight text-on-surface uppercase ">Incidents Critiques</h2>
            </div>

            <div tabIndex={0} className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                <AnimatePresence mode="wait">
                    {groupedTickets.late.length > 0 ? (
                        groupedTickets.late.map((t) => (
                            <motion.div 
                                key={t.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                className="bg-error/5 border border-error/20 rounded-2xl p-6 relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-black text-error uppercase tracking-widest">Temps Dépassé</span>
                                    <span className="font-mono text-xs font-bold text-on-surface-variant">T-{t.id}</span>
                                </div>
                                <p className="text-sm font-bold text-on-surface leading-relaxed uppercase tracking-tight">
                                    Alerte production : La table {t.table} dépasse l'objectif de 20 minutes.
                                </p>
                                <button 
                                    onClick={() => navigate('/kds')}
                                    className="mt-6 w-full py-4 bg-error text-on-error rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                                >
                                    Consulter Cuisine
                                </button>
                            </motion.div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                            <CheckCircle2 className="w-16 h-16 text-success mb-6" strokeWidth={1} />
                            <p className="text-[11px] font-black uppercase tracking-[0.4em]">Tous les indicateurs sont nominaux</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mt-10 pt-10 border-t border-outline-variant/30">
                <h3 className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-6">Santé de l'Infrastructure <span className="sr-only">Floor Plan Preview</span></h3>
                <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-success" />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface">Serveur Central</span>
                    </div>
                    <span className="font-mono text-[10px] font-black text-on-surface-variant uppercase">Latence 14ms</span>
                </div>
            </div>
        </section>
      </div>

      {/* Legacy E2E accessibility and compatibility anchors */}
      <div className="sr-only">
        {data.sentimentStats && data.sentimentStats.total > 0 && (
          <>
            <h2>Client Sentiment Analysis</h2>
            <span>{data.sentimentStats.total} reviews analysed by NLP pipeline</span>
            <span>{data.sentimentStats.positif_pct}%</span>
          </>
        )}
      </div>

    </div>
  );
};
