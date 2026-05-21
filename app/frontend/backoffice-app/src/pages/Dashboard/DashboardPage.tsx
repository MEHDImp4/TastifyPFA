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
    { label: "REAL-TIME REVENUE (CA)", value: `${data.todayRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH`, icon: TrendingUp, color: "text-primary", bg: "bg-surface-container", trend: "+12.4%", trendUp: true },
    { label: "COVER OCCUPANCY", value: `${data.activeTables} Tables`, icon: Users, color: "text-secondary", bg: "bg-surface-container", trend: "75%", trendUp: null },
    { label: "PENDING ORDERS", value: data.pendingOrders, icon: ShoppingBag, color: "text-primary", bg: "bg-surface-container", trend: "-5.2%", trendUp: false },
    { label: "AVG TURN TIME", value: `${data.avgPrepTime}m`, icon: Timer, color: "text-on-primary-container", bg: "bg-primary-container", trend: "TARGET: 90m", trendUp: true },
  ];

  const COLORS = ['#8d4e1c', '#8f4d17', '#703704', '#633e22', '#d1854e'];

  return (
    <motion.div 
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      <motion.div className="flex items-center justify-between" variants={fadeInUp}>
        <div>
          <h1 className="text-display-lg text-[32px] text-on-surface leading-none">Live Dashboard</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
            <span className="text-ui-data-dense uppercase tracking-widest text-on-surface-variant font-bold">Service Active: Dinner Operations</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-background border-2 border-on-surface shadow-[4px_4px_0px_#301400]">
              <Calendar strokeWidth={2.5} className="w-4 h-4 text-primary" />
              <span className="text-ui-label-bold text-[10px]">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" variants={staggerContainer}>
        {kpis.map((kpi, i) => (
          <motion.div 
            key={i} 
            className={`${kpi.bg} border-2 border-on-surface p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-all duration-150 hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#301400]`}
            variants={fadeInUp}
          >
            <div>
              <h3 className={`text-ui-label-bold text-[10px] mb-4 ${kpi.bg === 'bg-primary-container' ? 'text-on-primary-container/80' : 'text-on-surface-variant'}`}>{kpi.label}</h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-display-lg text-[36px] font-black ${kpi.bg === 'bg-primary-container' ? 'text-on-primary-container' : 'text-on-surface'}`}>{kpi.value}</span>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between border-t border-on-surface/10 pt-4">
              <span className={`text-ui-data-dense font-black ${kpi.trendUp === false ? 'text-error' : kpi.bg === 'bg-primary-container' ? 'text-on-primary-container' : 'text-secondary'}`}>
                {kpi.trendUp !== null && (kpi.trendUp ? '↑ ' : '↓ ')}
                {kpi.trend}
              </span>
              <kpi.icon strokeWidth={2.5} className={`w-5 h-5 ${kpi.bg === 'bg-primary-container' ? 'text-on-primary-container/40' : 'text-primary/30'}`} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div 
          className="lg:col-span-2 border-2 border-on-surface bg-surface-container p-6 flex flex-col shadow-[6px_6px_0px_#301400]"
          variants={fadeInUp}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-ui-label-bold text-[12px] text-on-surface">REVENUE VELOCITY (7D)</h3>
              <p className="text-ui-data-dense text-on-surface-variant mt-1 opacity-60">Geometric trend analysis</p>
            </div>
            <div className="bg-on-surface text-background px-3 py-1 text-[9px] font-black uppercase tracking-widest">Live Feed</div>
          </div>
          <div className="flex-1 w-full min-h-[240px] relative">
            {data.revenue7Days.length > 0 ? (
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenue7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8d4e1c" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8d4e1c" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" stroke="#301400" opacity={0.05} vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#301400" 
                      fontSize={10} 
                      fontFamily="Bricolage Grotesque"
                      fontWeight={800}
                      tickLine={false} 
                      axisLine={{ stroke: '#301400', strokeWidth: 2 }} 
                      dy={10}
                      tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()}
                    />
                    <YAxis 
                      stroke="#301400" 
                      fontSize={10} 
                      fontFamily="Bricolage Grotesque"
                      fontWeight={800}
                      tickLine={false} 
                      axisLine={{ stroke: '#301400', strokeWidth: 2 }}
                      tickFormatter={(val) => `${val}`}
                    />
                    <Tooltip 
                      cursor={{ stroke: '#301400', strokeWidth: 2 }}
                      contentStyle={{ backgroundColor: '#fff8f5', border: '2px solid #301400', borderRadius: '0', boxShadow: '4px 4px 0px #301400', padding: '12px' }}
                      itemStyle={{ color: '#8d4e1c', fontWeight: '900', fontSize: '14px', fontFamily: 'Bricolage Grotesque' }}
                      labelStyle={{ color: '#301400', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px', fontFamily: 'Bricolage Grotesque' }}
                    />
                    <Area type="stepAfter" dataKey="revenue" stroke="#8d4e1c" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" animationDuration={800} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-ui-label-bold text-on-surface-variant opacity-30 italic">NO DATA AVAILABLE</div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Top Dishes & Live Activity */}
        <div className="flex flex-col gap-6">
            <motion.div 
              className="border-2 border-on-surface bg-surface-container p-6 flex flex-col shadow-[6px_6px_0px_#301400]"
              variants={fadeInUp}
            >
                <h3 className="text-ui-label-bold text-[12px] text-on-surface mb-6 uppercase">Top Performing Dishes</h3>
                <div className="space-y-6 overflow-y-auto max-h-[300px] pr-2 scrollbar-hide">
                    {data.topDishes.length > 0 ? data.topDishes.map((dish, index) => (
                        <div key={index} className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-ui-label-bold text-[11px] text-on-surface truncate pr-4">{dish.name.toUpperCase()}</span>
                                <span className="text-ui-data-dense font-black text-primary">{dish.quantity} UNIT</span>
                            </div>
                            <div className="w-full h-4 bg-background border border-on-surface/20">
                                <motion.div 
                                    className="h-full bg-secondary" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(dish.quantity / Math.max(...data.topDishes.map(d => d.quantity))) * 100}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                            </div>
                        </div>
                    )) : (
                        <div className="h-full flex items-center justify-center text-ui-data-dense text-on-surface-variant opacity-30 italic">NO PERFORMANCE DATA</div>
                    )}
                </div>
            </motion.div>

            {/* Live Operations Feed */}
            {data.liveFeed && data.liveFeed.length > 0 && (
                <motion.div 
                  className="border-2 border-secondary bg-background p-6 flex flex-col shadow-[6px_6px_0px_#8f4d17]"
                  variants={fadeInUp}
                >
                    <h3 className="text-ui-label-bold text-[12px] text-secondary mb-4 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                        </span>
                        CRITICAL FEED
                    </h3>
                    <div className="space-y-3 overflow-y-auto max-h-[160px] pr-1 scrollbar-hide">
                        {data.liveFeed.map(feed => (
                            <div key={feed.id} className="p-3 border-l-4 border-secondary bg-surface-container-low flex flex-col gap-1 transition-all duration-150 hover:bg-surface-container-high">
                                <p className="text-ui-data-dense font-black text-on-surface leading-tight">
                                    {feed.message.toUpperCase()}
                                </p>
                                <span className="text-[9px] font-black text-on-surface-variant opacity-50 font-sans tracking-widest">
                                    {new Date(feed.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
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
