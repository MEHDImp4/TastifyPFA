import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowUpRight,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';
import { useSocketStore } from '../../store/socketStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTickets, setActiveTickets] = useState<Commande[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const lastUpdate = useSocketStore(state => state.lastUpdate);

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData, lastUpdate]);

  useEffect(() => {
    setCurrentTime(Date.now());
    const interval = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const groupedTickets = React.useMemo(() => {
    return {
      late: activeTickets.filter(t => {
        if (!currentTime) return false;
        const elapsed = (currentTime - new Date(t.created_at).getTime()) / 60000;
        return (t.statut === 'EN_CUISINE') && elapsed > 20;
      })
    };
  }, [activeTickets, currentTime]);

  const occupancyData = React.useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Occupé', value: data.activeTables, color: '#991B1B' },
      { name: 'Libre', value: Math.max(0, (data as any).totalTables ? (data as any).totalTables - data.activeTables : 28 - data.activeTables), color: '#F0E6DC' },
    ];
  }, [data]);

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
    { label: "Chiffre d'Affaires", value: `${data.todayRevenue.toFixed(0)} DH`, icon: TrendingUp, color: "text-primary" },
    { label: "Occupation Salle", value: `${Math.round((data.activeTables / 28) * 100)}%`, icon: Users, color: "text-primary" },
    { label: "Tickets Actifs", value: data.pendingOrders, icon: ShoppingBag, color: "text-primary" },
    { label: "Service Cuisine", value: `${data.avgPrepTime}m`, icon: Timer, color: "text-success" },
  ];

  return (
    <div className="flex-1 flex flex-col gap-6 md:gap-10 overflow-y-auto font-sans custom-scrollbar pb-6">

      <div className="flex-none flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
        <div>
           <h1 className="text-2xl md:text-4xl font-black tracking-tight text-on-surface">Tableau de Bord</h1>
           <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.18em] sm:tracking-[0.4em] mt-2">Intelligence Opérationnelle & Monitoring Direct</p>
        </div>
        <div className="flex min-h-[44px] items-center gap-3 bg-surface-container-high border border-outline-variant px-5 sm:px-8 py-3.5 rounded-xl">
           <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">Système Connecté</span>
        </div>
      </div>

      {/* KPI Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {kpis.map((kpi, i) => (
          <div key={i} className="luxury-card p-5 md:p-8 group transition-all cursor-default">
             <div className="flex justify-between items-center mb-6">
                <span className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.25em]">{kpi.label}</span>
                <div className="p-2.5 rounded-lg bg-primary/5 transition-colors group-hover:bg-primary/10">
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} strokeWidth={2.5} />
                </div>
             </div>
             <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-5xl font-black text-on-surface tracking-tighter tabular-nums">{kpi.value}</span>
             </div>
             <div className="mt-8 flex items-center justify-between">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{i === 0 ? 'Aujourd\'hui' : i === 1 ? `${data.activeTables}/28 Tables` : i === 2 ? 'En Cuisine / Prêts' : 'Objectif: 15m'}</span>
                <ArrowUpRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
             </div>
          </div>
        ))}
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Revenue Chart (7 cols) */}
        <div className="lg:col-span-7 luxury-card p-5 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-black tracking-tight text-on-surface uppercase">Évolution du Chiffre d'Affaires</h2>
          </div>
          {data.revenue7Days && data.revenue7Days.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenue7Days} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#991B1B" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#991B1B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E6DC" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700, fill: '#5C3E3E' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#5C3E3E' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #F0E6DC', background: '#FFFDFB', fontFamily: 'Karla' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#991B1B" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-on-surface-variant/40 text-xs font-bold uppercase tracking-widest">Données indisponibles</div>
          )}
        </div>

        {/* Top Dishes Bar Chart (5 cols) */}
        <div className="lg:col-span-5 luxury-card p-5 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent/5 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-accent" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-black tracking-tight text-on-surface uppercase">Plats Stars</h2>
          </div>
          {data.topDishes && data.topDishes.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topDishes.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E6DC" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fontWeight: 700, fill: '#5C3E3E' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 700, fill: '#450A0A' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #F0E6DC', background: '#FFFDFB', fontFamily: 'Karla' }} />
                  <Bar dataKey="quantity" radius={[0, 4, 4, 0]} fill="#B45309" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-on-surface-variant/40 text-xs font-bold uppercase tracking-widest">Données indisponibles</div>
          )}
        </div>
      </section>

      {/* Sentiment + Occupancy Row */}
      {data.sentimentStats && data.sentimentStats.total > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Sentiment Analysis */}
          <div className="luxury-card p-5 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-success/5 flex items-center justify-center">
                <Smile className="w-5 h-5 text-success" strokeWidth={2.5} />
              </div>
              <h2 className="text-lg font-black tracking-tight text-on-surface uppercase">Avis Clients</h2>
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Smile className="w-4 h-4 text-success" />
                    <span className="text-xs font-bold text-on-surface uppercase">Positifs</span>
                  </div>
                  <span className="font-mono text-sm font-black text-success">{data.sentimentStats.positif_pct}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full transition-all" style={{ width: `${data.sentimentStats.positif_pct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Meh className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold text-on-surface uppercase">Neutres</span>
                  </div>
                  <span className="font-mono text-sm font-black text-accent">{data.sentimentStats.neutre_pct}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${data.sentimentStats.neutre_pct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Frown className="w-4 h-4 text-error" />
                    <span className="text-xs font-bold text-on-surface uppercase">Négatifs</span>
                  </div>
                  <span className="font-mono text-sm font-black text-error">{data.sentimentStats.negatif_pct}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-error rounded-full transition-all" style={{ width: `${data.sentimentStats.negatif_pct}%` }} />
                </div>
              </div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pt-2">
                {data.sentimentStats.total} avis analysés
              </p>
            </div>
          </div>

          {/* Occupancy Pie */}
          <div className="luxury-card p-5 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" strokeWidth={2.5} />
              </div>
              <h2 className="text-lg font-black tracking-tight text-on-surface uppercase">Occupation Salle</h2>
            </div>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={80}
                    paddingAngle={3} dataKey="value"
                    stroke="none"
                  >
                    {occupancyData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #F0E6DC', background: '#FFFDFB', fontFamily: 'Karla' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <span className="font-mono text-2xl font-black text-on-surface">{Math.round((data.activeTables / 28) * 100)}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Occupé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: '#F0E6DC' }} />
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Libre</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Operation Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 min-h-0">

        {/* Left: Tactical Feed (7 cols) */}
        <section className="lg:col-span-7 flex flex-col min-h-0">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" strokeWidth={2.5} />
                 </div>
                 <h2 className="text-xl font-black tracking-tight text-on-surface uppercase">Flux Opérationnel</h2>
              </div>
              <button onClick={() => navigate('/salle')} className="min-h-[44px] px-5 border border-outline-variant rounded-lg text-[10px] font-black uppercase tracking-widest text-on-background hover:text-primary hover:border-primary transition-all flex items-center gap-2">
                Accéder au Plan <ChevronRight className="w-4 h-4" />
              </button>
           </div>

           <div tabIndex={0} className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
              <div className="grid grid-cols-1 gap-4">
                 {activeTickets.length > 0 ? activeTickets.map((ticket, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        key={ticket.id}
                        className="luxury-card p-5 md:p-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between hover:border-primary/20 transition-all group"
                    >
                        <div className="flex items-center gap-4 md:gap-8">
                            <div className="w-16 h-16 bg-surface-container-high border border-outline-variant rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                                <span className="font-mono text-2xl font-black">T{ticket.table}</span>
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-on-surface uppercase tracking-tight">Commande #{ticket.id}</h4>
                                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mt-1.5">
                                    {ticket.lignes.length} Articles • {ticket.type.replace('_', ' ')}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 md:gap-10">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Durée</p>
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
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-on-surface">Aucune transaction active</p>
                    </div>
                 )}
              </div>
           </div>
        </section>

        {/* Right: Alerts (5 cols) */}
        <section className="lg:col-span-5 flex flex-col min-h-0 luxury-card p-6 xl:p-10 overflow-hidden">
            <div className="flex-none flex items-center gap-4 mb-6 xl:mb-10 border-b border-outline-variant/30 pb-6">
                <div className="w-10 h-10 rounded-lg bg-error/5 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-error" />
                </div>
                <h2 className="text-xl font-black tracking-tight text-on-surface uppercase">Incidents Critiques</h2>
            </div>

            <div tabIndex={0} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-6">
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
                                    className="mt-6 w-full min-h-[44px] py-4 bg-error text-on-error rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                                >
                                    Consulter Cuisine
                                </button>
                            </motion.div>
                        ))
                    ) : (
                        <div className="min-h-full py-8 flex flex-col items-center justify-center text-center opacity-20">
                            <CheckCircle2 className="w-16 h-16 text-success mb-6" strokeWidth={1} />
                            <p className="max-w-[18rem] text-[11px] font-black uppercase tracking-[0.24em] leading-6">Tous les indicateurs sont nominaux</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </section>
      </div>

    </div>
  );
};
