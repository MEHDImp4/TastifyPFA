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
  Sparkles,
  Info,
  ChevronRight,
  Plus
  } from 'lucide-react';

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
  
  if (!data) return <div className="text-center py-10 text-on-surface-variant font-sans font-bold tracking-widest uppercase text-[10px]">Communication protocol failure. Data registry offline.</div>;

  const kpis = [
    { label: "REAL-TIME REVENUE (CA)", value: `${data.todayRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH`, icon: TrendingUp, color: "text-primary", bg: "bg-surface-container", trend: "+12.4%", trendUp: true },
    { label: "COVER OCCUPANCY", value: `${data.activeTables} UNIT`, icon: Users, color: "text-secondary", bg: "bg-surface-container", trend: "75%", trendUp: null },
    { label: "PENDING ORDERS", value: data.pendingOrders, icon: ShoppingBag, color: "text-primary", bg: "bg-surface-container", trend: "-5.2%", trendUp: false },
    { label: "AVG TURN TIME", value: `${data.avgPrepTime}M`, icon: Timer, color: "text-on-primary-container", bg: "bg-primary-container", trend: "TARGET: 90M", trendUp: true },
  ];

  return (
    <motion.div 
      className="space-y-staff-gutter"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {/* Tactical Header */}
      <motion.header className="flex justify-between items-center mb-unit-lg" variants={fadeInUp}>
        <div>
          <h2 className="text-display-lg text-[32px] text-on-surface leading-none">Live Dashboard</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-ui-data-dense uppercase tracking-widest text-on-surface-variant font-bold text-[10px]">Service Active: Operational Status Green</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2 mr-4">
              {[1, 2].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-surface-container-high flex items-center justify-center text-primary text-[10px] font-black">ST</div>
              ))}
          </div>
          <div className="bg-surface-container-high px-4 py-2 rounded-lg border border-on-surface flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-secondary"></div>
              <span className="text-ui-data-dense font-black text-[10px] tracking-widest">12 STAFF ONLINE</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-background border-2 border-on-surface shadow-[4px_4px_0px_#301400]">
              <Calendar strokeWidth={2.5} className="w-4 h-4 text-primary" />
              <span className="text-ui-label-bold text-[10px] font-black">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase()}</span>
          </div>
        </div>
      </motion.header>

      {/* KPI Grid - High Contrast */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" variants={staggerContainer}>
        {kpis.map((kpi, i) => (
          <motion.section 
            key={i} 
            className={`${kpi.bg} border-2 border-on-surface p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-all duration-150 hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#301400]`}
            variants={fadeInUp}
          >
            <div>
              <h3 className={`text-ui-label-bold text-[10px] font-black tracking-[0.2em] mb-4 ${kpi.bg === 'bg-primary-container' ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>{kpi.label}</h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-display-lg text-[40px] font-black leading-none ${kpi.bg === 'bg-primary-container' ? 'text-on-primary-container' : 'text-primary'}`} style={{ color: kpi.bg === 'bg-primary-container' ? '#ffceaf' : '#703704' }}>{kpi.value}</span>
                <span className={`text-ui-data-dense font-black text-[11px] ${kpi.trendUp === false ? 'text-error' : kpi.bg === 'bg-primary-container' ? 'text-on-primary-container/60' : 'text-secondary'}`}>
                  {kpi.trendUp !== null && (kpi.trendUp ? '↑ ' : '↓ ')}
                  {kpi.trend}
                </span>
              </div>
            </div>
            
            <div className={`mt-4 flex items-center justify-between border-t pt-4 ${kpi.bg === 'bg-primary-container' ? 'border-on-primary-container/20' : 'border-on-surface/10'}`}>
              <div className="flex gap-1 h-6 items-end">
                {[1, 2, 3, 4, 5].map(j => (
                    <div key={j} className={`w-1 rounded-sm ${kpi.bg === 'bg-primary-container' ? 'bg-on-primary-container/30' : 'bg-primary/20'}`} style={{ height: `${20 + Math.random() * 80}%` }} />
                ))}
              </div>
              <kpi.icon strokeWidth={2.5} className={`w-5 h-5 ${kpi.bg === 'bg-primary-container' ? 'text-on-primary-container/40' : 'text-primary/30'}`} />
            </div>
          </motion.section>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Orchestration Feed (Replacing Recharts with something more tactical or heavily styling it) */}
        <motion.section 
          className="lg:col-span-8 border-2 border-on-surface bg-surface-container p-0 flex flex-col shadow-[6px_6px_0px_#301400]"
          variants={fadeInUp}
        >
          <div className="border-b-2 border-on-surface p-unit-md flex justify-between items-center bg-surface-container-high">
              <div>
                <h3 className="text-ui-label-bold text-[12px] font-black text-on-surface tracking-widest uppercase">Live Kitchen Orchestration (KDS)</h3>
                <p className="text-[9px] font-black text-on-surface-variant opacity-60 uppercase">Real-time station status</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-on-surface text-background font-ui-data-dense text-[10px] font-black rounded uppercase">Urgent: 03</span>
                <span className="px-3 py-1 border-2 border-on-surface font-ui-data-dense text-[10px] font-black rounded uppercase">Pending: {data.pendingOrders}</span>
              </div>
          </div>
          
          <div className="flex-grow overflow-x-auto">
            <table className="w-full text-left font-ui-data-dense border-collapse min-w-[600px]">
              <thead className="bg-surface-container-highest border-b-2 border-on-surface">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Unit</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Selections</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Station</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Interval</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-on-surface/5">
                {[
                    { unit: 'T12-4', items: '2x WAGYU TARTARE, 1x SCALLOP', station: 'COLD', time: '12:04', status: 'FIRING', urgent: true },
                    { unit: 'T05-2', items: '1x DUCK BREAST, 1x SEA BASS', station: 'HOT', time: '08:45', status: 'COOKING', urgent: false },
                    { unit: 'T24-6', items: 'CHEF\'S TASTING MENU x6', station: 'MAIN', time: '05:12', status: 'PLATING', urgent: false },
                    { unit: 'T02-2', items: '2x SOUFFLÉ (WAIT 15M)', station: 'PASTRY', time: '02:30', status: 'HOLD', urgent: false },
                ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-high transition-colors group">
                        <td className="p-4 font-black text-on-surface text-sm">{row.unit}</td>
                        <td className="p-4 font-bold text-on-surface text-xs uppercase tracking-tight">{row.items}</td>
                        <td className="p-4 text-center"><span className="text-[10px] font-black px-2 py-1 bg-surface-container-highest rounded border border-on-surface/10">{row.station}</span></td>
                        <td className={`p-4 text-center font-black text-xs ${row.urgent ? 'text-error animate-pulse' : 'text-on-surface'}`}>{row.time}</td>
                        <td className="p-4 text-right">
                            <span className={`inline-block px-3 py-1 rounded text-[10px] font-black tracking-widest ${row.status === 'FIRING' ? 'bg-secondary-container text-on-secondary-fixed' : 'bg-surface-container-high border border-on-surface text-on-surface'}`}>
                                {row.status}
                            </span>
                        </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t-2 border-on-surface bg-surface-container-high flex justify-center">
              <button className="text-[10px] font-black uppercase tracking-[0.4em] text-primary hover:text-secondary transition-colors flex items-center gap-2">
                  Launch Full KDS Module <ChevronRight className="w-4 h-4" />
              </button>
          </div>
        </motion.section>

        {/* Right Column: Performance & System Status */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Top Performance */}
            <motion.section 
              className="border-2 border-on-surface bg-surface-container p-6 flex flex-col shadow-[6px_6px_0px_#301400]"
              variants={fadeInUp}
            >
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-ui-label-bold text-[12px] font-black text-on-surface uppercase tracking-widest">High Velocity Creations</h3>
                    <Sparkles className="w-4 h-4 text-secondary" />
                </div>
                <div className="space-y-8">
                    {data.topDishes.slice(0, 3).map((dish, index) => (
                        <div key={index} className="group cursor-default">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-ui-label-bold text-[11px] font-black text-on-surface uppercase tracking-tight truncate pr-4">{dish.name}</span>
                                <span className="text-ui-data-dense font-black text-primary text-[10px]">{dish.quantity} UNIT</span>
                            </div>
                            <div className="w-full h-2 bg-background border border-on-surface/20 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-secondary" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(dish.quantity / Math.max(...data.topDishes.map(d => d.quantity))) * 100}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <button className="mt-10 w-full py-3 border-2 border-on-surface text-[10px] font-black uppercase tracking-[0.3em] hover:bg-on-surface hover:text-background transition-all active:scale-95">
                    Full Registry Log
                </button>
            </motion.section>

            {/* System Status / Floor Plan Alpha */}
            <motion.section 
              className="border-2 border-on-surface bg-surface-container p-6 flex flex-col shadow-[6px_6px_0px_#301400]"
              variants={fadeInUp}
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-ui-label-bold text-[12px] font-black text-on-surface uppercase tracking-widest">Floor Plan Alpha</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 bg-secondary rounded-sm"></span>
                            <span className="text-ui-data-dense text-[9px] font-black text-on-surface-variant uppercase tracking-widest">3 Units Awaiting Reset</span>
                        </div>
                    </div>
                    <Plus className="w-4 h-4 text-on-surface cursor-pointer hover:rotate-90 transition-transform" />
                </div>
                <div className="grid grid-cols-4 gap-3 p-4 bg-background border border-on-surface/10 rounded-xl relative group overflow-hidden">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className={`aspect-square border-2 border-on-surface rounded-md transition-all ${[1, 4, 7].includes(i) ? 'bg-secondary/20 shadow-inner' : 'bg-on-surface/5'}`} />
                    ))}
                    <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <span className="text-[9px] font-black text-background uppercase tracking-[0.4em]">Initialize Map View</span>
                    </div>
                </div>
            </motion.section>

            {/* Critical Updates Feed */}
            {data.liveFeed && data.liveFeed.length > 0 && (
                <motion.section 
                  className="border-2 border-secondary bg-secondary-container/5 p-6 flex flex-col shadow-[6px_6px_0px_#8f4d17]"
                  variants={fadeInUp}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-ui-label-bold text-[11px] font-black text-secondary flex items-center gap-2 tracking-[0.2em]">
                            <Info className="w-4 h-4" />
                            CRITICAL LIAISON
                        </h3>
                        <span className="text-[8px] font-black text-secondary bg-secondary/10 px-2 py-0.5 rounded uppercase">Real-time</span>
                    </div>
                    <div className="space-y-4">
                        {data.liveFeed.slice(0, 1).map(feed => (
                            <div key={feed.id} className="space-y-4">
                                <p className="text-ui-data-dense font-black text-on-surface leading-tight text-xs uppercase tracking-tight">
                                    {feed.message}
                                </p>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-on-surface-variant opacity-40 uppercase tracking-widest">
                                        {new Date(feed.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <button className="bg-secondary text-on-secondary px-6 py-2 text-[9px] font-black uppercase tracking-[0.3em] rounded hover:scale-105 active:scale-95 transition-all shadow-lg shadow-secondary/20">ACKNOWLEDGE</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.section>
            )}
        </div>
      </div>
    </motion.div>
  );
};

