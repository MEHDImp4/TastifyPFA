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
      <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="w-48 h-6 rounded-xl" />
            <Skeleton className="w-64 h-3 rounded-xl" />
          </div>
          <Skeleton className="w-24 h-8 rounded-xl border border-outline-variant/30" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
           <Skeleton className="lg:col-span-2 h-[200px] rounded-2xl border border-outline-variant/30" />
           <Skeleton className="h-[200px] rounded-2xl border border-outline-variant/30" />
        </div>
      </div>
    );
  }
  
  if (!data) return <div className="text-center py-10 text-on-surface-variant font-sans font-bold tracking-widest uppercase text-[10px]">Erreur lors du chargement des données.</div>;

  const kpis = [
    { label: "Chiffre d'affaires", value: `${data.todayRevenue.toFixed(2)} DH`, icon: TrendingUp, color: "text-primary", bg: "bg-primary-container/20", trend: "+12.4%", trendUp: true },
    { label: "Tables Actives", value: data.activeTables, icon: Users, color: "text-secondary", bg: "bg-secondary-container/50", trend: "Normal", trendUp: null },
    { label: "Commandes en cours", value: data.pendingOrders, icon: ShoppingBag, color: "text-primary", bg: "bg-primary-container/10", trend: "-5.2%", trendUp: false },
    { label: "Temps prep. moyen", value: `${data.avgPrepTime} min`, icon: Timer, color: "text-primary", bg: "bg-primary-container/20", trend: "Optimal", trendUp: true },
  ];

  const COLORS = ['#8d4e1c', '#fea86a', '#b49076', '#8f4d17', '#d1854e'];

  return (
    <motion.div 
      className="max-w-7xl mx-auto space-y-4"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      <motion.div className="flex items-center justify-between" variants={fadeInUp}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface font-sans flex items-center gap-2">
            Strategic Intelligence
            <Sparkles strokeWidth={2} className="w-5 h-5 text-primary/60" />
          </h1>
          <p className="text-on-surface-variant mt-0.5 font-sans text-xs tracking-wide">Real-time operational overview and performance analytics.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-xl border border-surface-container-high text-[10px] font-bold text-on-surface-variant uppercase tracking-widest shadow-sm">
            <Calendar strokeWidth={2} className="w-3.5 h-3.5 text-primary" />
            <span className="font-sans">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" variants={staggerContainer}>
        {kpis.map((kpi, i) => (
          <motion.div 
            key={i} 
            className="double-bezel p-4 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/5 cursor-default group"
            variants={fadeInUp}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${kpi.bg} ${kpi.color} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                <kpi.icon strokeWidth={2} className="w-4 h-4" />
              </div>
              {kpi.trendUp !== null && (
                <div className={`flex items-center gap-1 text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-md shadow-sm ${kpi.trendUp ? 'bg-primary-container/20 text-primary' : 'bg-error-container/50 text-error'}`}>
                  {kpi.trendUp ? <ArrowUpRight strokeWidth={2} className="w-2.5 h-2.5" /> : <ArrowDownRight strokeWidth={2} className="w-2.5 h-2.5" />}
                  {kpi.trend}
                </div>
              )}
            </div>
            <p className="text-on-surface-variant text-[9px] font-bold uppercase tracking-[0.2em] mb-1 font-sans opacity-70">{kpi.label}</p>
            <h3 className="text-xl font-bold text-on-surface tracking-tight font-sans leading-none">{kpi.value}</h3>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <motion.div 
          className="lg:col-span-2 double-bezel p-5 min-w-0 flex flex-col"
          variants={fadeInUp}
        >
          <div className="flex items-center justify-between mb-4 pb-2">
            <div>
              <h3 className="text-base font-bold tracking-tight text-on-surface font-sans">Revenue Velocity</h3>
              <p className="text-[10px] text-on-surface-variant font-sans tracking-wide mt-0.5 opacity-70">Daily revenue trends over the last 7 sessions</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_4px_rgba(141,78,28,0.5)]" />
                    <span className="text-[9px] font-bold font-sans text-on-surface-variant uppercase tracking-widest opacity-80">Gross Sales</span>
                </div>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[180px] relative">
            {data.revenue7Days.length > 0 ? (
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenue7Days} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8d4e1c" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#8d4e1c" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eae7e7" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#747688" 
                      fontSize={10} 
                      fontFamily="Bricolage Grotesque"
                      fontWeight={600}
                      tickLine={false} 
                      axisLine={false} 
                      dy={8}
                      tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { weekday: 'short' })}
                    />
                    <YAxis 
                      stroke="#747688" 
                      fontSize={10} 
                      fontFamily="Bricolage Grotesque"
                      fontWeight={600}
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `${val} DH`}
                    />
                    <Tooltip 
                      cursor={{ stroke: '#8d4e1c', strokeWidth: 1, strokeDasharray: '4 4' }}
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid #eae7e7', borderRadius: '1rem', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', padding: '12px' }}
                      itemStyle={{ color: '#8d4e1c', fontWeight: 'bold', fontSize: '12px', fontFamily: 'Bricolage Grotesque' }}
                      labelStyle={{ color: '#301400', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px', fontFamily: 'Bricolage Grotesque' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#8d4e1c" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" animationDuration={1000} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-on-surface-variant font-sans text-xs opacity-50 italic">Pas de données</div>
            )}
          </div>
        </motion.div>

        {/* Top Dishes Chart & Live Activity container */}
        <div className="flex flex-col gap-4">
            <motion.div 
              className="double-bezel p-4 flex-1 min-h-[160px] flex flex-col"
              variants={fadeInUp}
            >
                <h3 className="text-xs font-bold tracking-tight text-on-surface mb-4 font-sans">Signature Dishes</h3>
                <div className="flex-1 w-full relative">
                    {data.topDishes.length > 0 ? (
                    <div className="absolute inset-0">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topDishes} layout="vertical" margin={{ left: -15, right: 20, top: 0, bottom: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" stroke="#301400" fontSize={10} fontFamily="Bricolage Grotesque" fontWeight={600} width={80} axisLine={false} tickLine={false} />
                            <Tooltip 
                            cursor={{ fill: '#fff1ea', radius: 4 }}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid #eae7e7', borderRadius: '0.75rem', padding: '8px', boxShadow: '0 4px 10px rgba(141,78,28,0.05)' }}
                            />
                            <Bar dataKey="quantity" radius={[0, 4, 4, 0]} barSize={12} animationDuration={1000}>
                            {data.topDishes.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Bar>
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                    ) : (
                    <div className="h-full flex items-center justify-center text-on-surface-variant font-sans text-[10px] italic opacity-50">Pas de données</div>
                    )}
                </div>
            </motion.div>

            {/* Live Feed */}
            {data.liveFeed && data.liveFeed.length > 0 && (
                <motion.div 
                  className="double-bezel p-4 min-w-0 flex-1 flex flex-col"
                  variants={fadeInUp}
                >
                    <h3 className="text-xs font-bold tracking-tight text-on-surface mb-3 flex items-center gap-2 font-sans">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                        </span>
                        Live Operations
                    </h3>
                    <div className="space-y-2 overflow-y-auto max-h-[120px] pr-1 scrollbar-hide">
                        {data.liveFeed.map(feed => (
                            <div key={feed.id} className="p-2.5 bg-surface-container-low rounded-xl border border-surface-container-high hover:bg-white hover:shadow-sm transition-all duration-200 animate-in slide-in-from-right-4">
                                <p className={`text-[11px] font-bold tracking-tight font-sans leading-snug ${feed.type === 'ORDER' ? 'text-primary' : 'text-on-surface'}`}>
                                    {feed.message}
                                </p>
                                <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-[0.2em] mt-1 font-sans opacity-50">
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
