import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../api/analytics';
import type { DashboardData } from '../../api/analytics';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Timer,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
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

  const COLORS = ['#0040e0', '#2e5bff', '#5d5f5f', '#124af0', '#0035be'];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface font-sans">Strategic Intelligence</h1>
          <p className="text-on-surface-variant mt-1.5 font-sans font-medium">Real-time operational overview and performance analytics.</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 bg-surface-container-low rounded-xl border border-surface-container-high text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-sans">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="double-bezel p-8 transition-all hover:scale-[1.02] cursor-default group">
            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              {kpi.trendUp !== null && (
                <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg ${kpi.trendUp ? 'bg-primary-container/20 text-primary' : 'bg-error-container/50 text-error'}`}>
                  {kpi.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend}
                </div>
              )}
            </div>
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-2 font-sans opacity-70">{kpi.label}</p>
            <h3 className="text-3xl font-bold text-on-surface tracking-tight font-sans">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 double-bezel p-10 min-w-0">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-on-surface font-sans">Revenue Velocity</h3>
              <p className="text-sm text-on-surface-variant font-medium mt-1">Daily revenue trends over the last 7 sessions.</p>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Gross Sales</span>
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
                        <stop offset="5%" stopColor="#0040e0" stopOpacity={0.12}/>
                        <stop offset="95%" stopColor="#0040e0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e2e1" vertical={false} />
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
                      tickFormatter={(val) => `${val}DH`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid #eae7e7', borderRadius: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                      itemStyle={{ color: '#0040e0', fontWeight: 'bold', fontSize: '13px' }}
                      labelStyle={{ color: '#1c1b1b', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#0040e0" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-on-surface-variant font-sans text-sm">Pas de données de revenus disponibles.</div>
            )}
          </div>
        </div>

        {/* Top Dishes Chart & Live Activity container */}
        <div className="flex flex-col gap-8">
            <div className="double-bezel p-8 min-w-0">
                <h3 className="text-lg font-bold tracking-tight text-on-surface mb-8 font-sans">Signature Dishes</h3>
                <div className="h-[220px] w-full relative">
                    {data.topDishes.length > 0 ? (
                    <div className="absolute inset-0">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topDishes} layout="vertical" margin={{ left: -10, right: 30, top: 0, bottom: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" stroke="#1c1b1b" fontSize={11} fontWeight={600} width={90} axisLine={false} tickLine={false} />
                            <Tooltip 
                            cursor={{ fill: '#f6f3f2' }}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid #eae7e7', borderRadius: '1rem' }}
                            />
                            <Bar dataKey="quantity" radius={[0, 8, 8, 0]} barSize={16}>
                            {data.topDishes.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Bar>
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                    ) : (
                    <div className="h-full flex items-center justify-center text-on-surface-variant font-sans text-sm">Pas de données de plats disponibles.</div>
                    )}
                </div>
            </div>

            {/* Live Feed */}
            {data.liveFeed && data.liveFeed.length > 0 && (
                <div className="double-bezel p-8 min-w-0 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold tracking-tight text-on-surface mb-6 flex items-center gap-2 font-sans">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Live Operations
                    </h3>
                    <div className="space-y-4 overflow-y-auto max-h-[250px] pr-2 scrollbar-hide">
                        {data.liveFeed.map(feed => (
                            <div key={feed.id} className="p-4 bg-surface-container-low rounded-xl border border-surface-container-high transition-transform hover:scale-[1.01] animate-in slide-in-from-right-4 duration-500">
                                <p className={`text-sm font-bold tracking-tight font-sans ${feed.type === 'ORDER' ? 'text-primary' : 'text-on-surface'}`}>
                                    {feed.message}
                                </p>
                                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-2 opacity-60">
                                    {new Date(feed.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
