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
            <Skeleton className="w-48 h-8" />
            <Skeleton className="w-64 h-4" />
          </div>
          <Skeleton className="w-32 h-10 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Skeleton className="lg:col-span-2 h-[400px] rounded-3xl" />
           <Skeleton className="h-[400px] rounded-3xl" />
        </div>
      </div>
    );
  }
  
  if (!data) return <div className="text-center py-20 text-on-surface-variant font-sans">Erreur lors du chargement des données.</div>;

  const kpis = [
    { label: "Chiffre d'affaires", value: `${data.todayRevenue.toFixed(2)} DH`, icon: TrendingUp, color: "text-primary", bg: "bg-primary-container/20", trend: "+12.4%", trendUp: true },
    { label: "Tables Actives", value: data.activeTables, icon: Users, color: "text-secondary", bg: "bg-secondary-container/50", trend: "Normal", trendUp: null },
    { label: "Commandes en cours", value: data.pendingOrders, icon: ShoppingBag, color: "text-primary", bg: "bg-primary-container/10", trend: "-5.2%", trendUp: false },
    { label: "Temps prep. moyen", value: `${data.avgPrepTime} min`, icon: Timer, color: "text-primary", bg: "bg-primary-container/20", trend: "Optimal", trendUp: true },
  ];

  const COLORS = ['#8d4e1c', '#2e5bff', '#5d5f5f', '#124af0', '#0035be'];

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
            <Sparkles className="w-6 h-6 text-primary/40" />
          </h1>
          <p className="text-on-surface-variant mt-1.5 font-sans font-medium opacity-70">Real-time operational overview and performance analytics.</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 bg-surface-container-low rounded-xl border border-surface-container-high text-xs font-bold text-on-surface-variant uppercase tracking-widest shadow-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-sans">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" variants={staggerContainer}>
        {kpis.map((kpi, i) => (
          <motion.div 
            key={i} 
            className="double-bezel p-8 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5 cursor-default group"
            variants={fadeInUp}
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.bg} ${kpi.color} transition-transform duration-500 group-hover:scale-110 shadow-sm`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              {kpi.trendUp !== null && (
                <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg ${kpi.trendUp ? 'bg-primary-container/20 text-primary' : 'bg-error-container/50 text-error'} shadow-sm`}>
                  {kpi.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend}
                </div>
              )}
            </div>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.2em] mb-2 font-sans opacity-50">{kpi.label}</p>
            <h3 className="text-3xl font-bold text-on-surface tracking-tight font-sans leading-none">{kpi.value}</h3>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <motion.div 
          className="lg:col-span-2 double-bezel p-10 min-w-0"
          variants={fadeInUp}
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-on-surface font-sans">Revenue Velocity</h3>
              <p className="text-sm text-on-surface-variant font-medium mt-1 opacity-70">Daily revenue trends over the last 7 sessions.</p>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,64,224,0.5)]" />
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-80">Gross Sales</span>
                </div>
            </div>
          </div>
          <div className="h-[320px] w-full relative">
            {data.revenue7Days.length > 0 ? (
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenue7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      fontSize={11} 
                      fontWeight={600}
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                      tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { weekday: 'short' })}
                    />
                    <YAxis 
                      stroke="#747688" 
                      fontSize={11} 
                      fontWeight={600}
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `${val} DH`}
                    />
                    <Tooltip 
                      cursor={{ stroke: '#8d4e1c', strokeWidth: 1, strokeDasharray: '4 4' }}
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid #eae7e7', borderRadius: '1.25rem', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', padding: '16px' }}
                      itemStyle={{ color: '#8d4e1c', fontWeight: 'bold', fontSize: '14px' }}
                      labelStyle={{ color: '#1c1b1b', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#8d4e1c" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-on-surface-variant font-sans text-sm italic opacity-50">Pas de données de revenus disponibles.</div>
            )}
          </div>
        </motion.div>

        {/* Top Dishes Chart & Live Activity container */}
        <div className="flex flex-col gap-8">
            <motion.div 
              className="double-bezel p-8 min-w-0"
              variants={fadeInUp}
            >
                <h3 className="text-lg font-bold tracking-tight text-on-surface mb-8 font-sans">Signature Dishes</h3>
                <div className="h-[220px] w-full relative">
                    {data.topDishes.length > 0 ? (
                    <div className="absolute inset-0">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topDishes} layout="vertical" margin={{ left: -10, right: 30, top: 0, bottom: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" stroke="#1c1b1b" fontSize={11} fontWeight={600} width={90} axisLine={false} tickLine={false} />
                            <Tooltip 
                            cursor={{ fill: '#f6f3f2', radius: 8 }}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid #eae7e7', borderRadius: '1rem', padding: '12px' }}
                            />
                            <Bar dataKey="quantity" radius={[0, 8, 8, 0]} barSize={16} animationDuration={1500}>
                            {data.topDishes.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Bar>
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                    ) : (
                    <div className="h-full flex items-center justify-center text-on-surface-variant font-sans text-sm italic opacity-50">Pas de données de plats disponibles.</div>
                    )}
                </div>
            </motion.div>

            {/* Live Feed */}
            {data.liveFeed && data.liveFeed.length > 0 && (
                <motion.div 
                  className="double-bezel p-8 min-w-0 flex-1 flex flex-col"
                  variants={fadeInUp}
                >
                    <h3 className="text-lg font-bold tracking-tight text-on-surface mb-6 flex items-center gap-3 font-sans">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                        Live Operations
                    </h3>
                    <div className="space-y-4 overflow-y-auto max-h-[250px] pr-2 scrollbar-hide">
                        {data.liveFeed.map(feed => (
                            <div key={feed.id} className="p-4 bg-surface-container-low rounded-2xl border border-surface-container-high transition-all duration-500 hover:scale-[1.02] hover:bg-white animate-in slide-in-from-right-4">
                                <p className={`text-sm font-bold tracking-tight font-sans leading-tight ${feed.type === 'ORDER' ? 'text-primary' : 'text-on-surface'}`}>
                                    {feed.message}
                                </p>
                                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.2em] mt-2.5 opacity-50">
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
