import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { analyticsApi } from '../../api/analytics';
import type { DashboardData } from '../../api/analytics';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Timer,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
  } from 'lucide-react';

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { KpiSkeleton, Skeleton } from '../../components/ui/Skeleton';

import { useSocketStore } from '../../store/socketStore';
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] as const }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastUpdate = useSocketStore(state => state.lastUpdate);

  const fetchDashboard = async () => {
    try {
      const res = await analyticsApi.getDashboardData();
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [lastUpdate]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="w-48 h-8 rounded-none" />
            <Skeleton className="w-64 h-4 rounded-none" />
          </div>
          <Skeleton className="w-32 h-10 rounded-none border border-outline" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Skeleton className="lg:col-span-2 h-[400px] rounded-none border border-outline" />
           <Skeleton className="h-[400px] rounded-none border border-outline" />
        </div>
      </div>
    );
  }
  
  if (!data) return <div className="text-center py-20 text-on-surface-variant font-mono font-bold tracking-widest uppercase">Erreur lors du chargement des données.</div>;

  const kpis = [
    { label: "Chiffre d'affaires", value: `${data.todayRevenue.toFixed(2)} DH`, icon: TrendingUp, color: "text-primary", bg: "bg-surface-dim", border: "border-primary", trend: "+12.4%", trendUp: true },
    { label: "Tables Actives", value: data.activeTables, icon: Users, color: "text-on-surface", bg: "bg-surface-dim", border: "border-outline", trend: "Normal", trendUp: null },
    { label: "Commandes en cours", value: data.pendingOrders, icon: ShoppingBag, color: "text-primary", bg: "bg-surface-dim", border: "border-primary", trend: "-5.2%", trendUp: false },
    { label: "Temps prep. moyen", value: `${data.avgPrepTime} min`, icon: Timer, color: "text-on-surface", bg: "bg-surface-dim", border: "border-outline", trend: "Optimal", trendUp: true },
  ];

  const COLORS = ['#1e40af', '#3b82f6', '#475569', '#64748b', '#94a3b8'];

  return (
    <motion.div 
      className="max-w-7xl mx-auto space-y-10"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      <motion.div className="flex items-center justify-between" variants={fadeInUp}>
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-on-surface font-sans flex items-center gap-3">
            Strategic Intelligence
            <Sparkles strokeWidth={1.5} className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-on-surface-variant mt-1.5 font-mono text-sm tracking-wide">Real-time operational overview and performance analytics.</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 bg-surface rounded-none border border-outline text-xs font-bold text-on-surface uppercase tracking-widest shadow-[2px_2px_0px_rgba(15,23,42,0.1)]">
            <Calendar strokeWidth={1.5} className="w-4 h-4 text-primary" />
            <span className="font-mono">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" variants={staggerContainer}>
        {kpis.map((kpi, i) => (
          <motion.div 
            key={i} 
            className="double-bezel p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(15,23,42,0.15)] cursor-default group"
            variants={fadeInUp}
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`w-10 h-10 flex items-center justify-center border ${kpi.border} ${kpi.bg} ${kpi.color} shadow-[2px_2px_0px_rgba(15,23,42,0.1)]`}>
                <kpi.icon strokeWidth={1.5} className="w-5 h-5" />
              </div>
              {kpi.trendUp !== null && (
                <div className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-1 border ${kpi.trendUp ? 'border-primary text-primary bg-primary/5' : 'border-error text-error bg-error/5'}`}>
                  {kpi.trendUp ? <ArrowUpRight strokeWidth={2} className="w-3 h-3" /> : <ArrowDownRight strokeWidth={2} className="w-3 h-3" />}
                  {kpi.trend}
                </div>
              )}
            </div>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.25em] mb-2 font-mono">{kpi.label}</p>
            <h3 className="text-3xl font-bold text-on-surface tracking-tight font-sans leading-none">{kpi.value}</h3>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <motion.div 
          className="lg:col-span-2 double-bezel p-8 min-w-0 flex flex-col"
          variants={fadeInUp}
        >
          <div className="flex items-center justify-between mb-8 border-b border-outline pb-4">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-on-surface font-sans uppercase">Revenue Velocity</h3>
              <p className="text-xs text-on-surface-variant font-mono tracking-widest uppercase mt-1">Daily revenue trends over the last 7 sessions</p>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-3 py-1 border border-outline bg-surface-dim">
                    <div className="w-2 h-2 bg-primary" />
                    <span className="text-[10px] font-bold font-mono text-on-surface uppercase tracking-widest">Gross Sales</span>
                </div>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[280px] relative">
            {data.revenue7Days.length > 0 ? (
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenue7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e40af" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#1e40af" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 2" stroke="#cbd5e1" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#475569" 
                      fontSize={11} 
                      fontFamily="Fira Code"
                      fontWeight={600}
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                      tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={11} 
                      fontFamily="Fira Code"
                      fontWeight={600}
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `${val} DH`}
                    />
                    <Tooltip 
                      cursor={{ stroke: '#1e40af', strokeWidth: 1, strokeDasharray: '4 4' }}
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #94a3b8', borderRadius: '0', boxShadow: '4px 4px 0px rgba(15,23,42,0.1)', padding: '16px' }}
                      itemStyle={{ color: '#1e40af', fontWeight: 'bold', fontSize: '14px', fontFamily: 'Fira Sans' }}
                      labelStyle={{ color: '#0f172a', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px', fontFamily: 'Fira Code' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#1e40af" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" animationDuration={1000} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-on-surface-variant font-mono text-sm tracking-widest uppercase opacity-50">Pas de données</div>
            )}
          </div>
        </motion.div>

        {/* Top Dishes Chart & Live Activity container */}
        <div className="flex flex-col gap-8">
            <motion.div 
              className="double-bezel p-6 flex-1 min-h-[220px] flex flex-col"
              variants={fadeInUp}
            >
                <h3 className="text-sm font-bold tracking-widest text-on-surface mb-6 font-mono uppercase border-b border-outline pb-4">Signature Dishes</h3>
                <div className="flex-1 w-full relative">
                    {data.topDishes.length > 0 ? (
                    <div className="absolute inset-0">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topDishes} layout="vertical" margin={{ left: -10, right: 30, top: 0, bottom: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" stroke="#0f172a" fontSize={11} fontFamily="Fira Sans" fontWeight={600} width={90} axisLine={false} tickLine={false} />
                            <Tooltip 
                            cursor={{ fill: '#e2e8f0' }}
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #94a3b8', borderRadius: '0', padding: '12px', boxShadow: '2px 2px 0px rgba(15,23,42,0.1)' }}
                            />
                            <Bar dataKey="quantity" radius={[0, 0, 0, 0]} barSize={16} animationDuration={1000}>
                            {data.topDishes.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Bar>
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                    ) : (
                    <div className="h-full flex items-center justify-center text-on-surface-variant font-mono text-xs uppercase tracking-widest opacity-50">Pas de données</div>
                    )}
                </div>
            </motion.div>

            {/* Live Feed */}
            {data.liveFeed && data.liveFeed.length > 0 && (
                <motion.div 
                  className="double-bezel p-6 min-w-0 flex-1 flex flex-col"
                  variants={fadeInUp}
                >
                    <h3 className="text-sm font-bold tracking-widest text-on-surface mb-6 flex items-center gap-3 font-mono uppercase border-b border-outline pb-4">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full bg-error opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 bg-error"></span>
                        </span>
                        Live Ops
                    </h3>
                    <div className="space-y-3 overflow-y-auto max-h-[200px] pr-2 scrollbar-hide">
                        {data.liveFeed.map(feed => (
                            <div key={feed.id} className="p-3 bg-surface border border-outline hover:border-on-surface transition-colors duration-200 animate-in slide-in-from-right-4 relative pl-8">
                                <div className="absolute left-3 top-4 w-1.5 h-1.5 bg-primary" />
                                <p className={`text-sm font-bold tracking-tight font-sans leading-snug ${feed.type === 'ORDER' ? 'text-primary' : 'text-on-surface'}`}>
                                    {feed.message}
                                </p>
                                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.2em] mt-1.5 font-mono">
                                    {new Date(feed.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
      </div>
    </motion.div>
  );
};
