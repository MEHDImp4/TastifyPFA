import React, { useState, useEffect } from 'react';
import { analyticsApi, DashboardData } from '../../api/analytics';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Timer, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  Calendar
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

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    const interval = setInterval(fetchDashboard, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <div className="h-full flex items-center justify-center text-teal"><Loader2 className="w-10 h-10 animate-spin" /></div>;
  if (!data) return <div className="text-center py-20 text-gray-500">Erreur lors du chargement des données.</div>;

  const kpis = [
    { label: "Chiffre d'affaires", value: `${data.todayRevenue.toFixed(2)} DH`, icon: TrendingUp, color: "text-teal", bg: "bg-teal/10", trend: "+12%" },
    { label: "Tables Actives", value: data.activeTables, icon: Users, color: "text-orange", bg: "bg-orange/10", trend: "Normal" },
    { label: "Commandes en cours", value: data.pendingOrders, icon: ShoppingBag, color: "text-amber", bg: "bg-amber/10", trend: "-5%" },
    { label: "Temps prep. moyen", value: `${data.avgPrepTime} min`, icon: Timer, color: "text-teal", bg: "bg-teal/10", trend: "Optimal" },
  ];

  const COLORS = ['#2A9D8F', '#E9C46A', '#F4A261', '#E76F51', '#264653'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
          <p className="text-gray-400 mt-1">Vue d'ensemble de l'activité du restaurant en temps réel.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-dark-surface rounded-xl border border-white/5 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <Calendar className="w-4 h-4 text-teal" />
            <span>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="p-6 bg-dark-surface rounded-[2rem] border border-white/10 shadow-lg hover:border-teal/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 ${kpi.trend.startsWith('+') ? 'text-teal' : kpi.trend.startsWith('-') ? 'text-terracotta' : 'text-gray-500'}`}>
                {kpi.trend}
              </span>
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-bold font-mono tracking-tighter">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 p-8 bg-dark-surface rounded-[2.5rem] border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold tracking-tight">Tendances des revenus (7j)</h3>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-teal" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ventes</span>
                </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue7Days}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2A9D8F" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2A9D8F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { weekday: 'short' })}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val} DH`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#264653', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                  itemStyle={{ color: '#2A9D8F', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2A9D8F" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Dishes Chart */}
        <div className="p-8 bg-dark-surface rounded-[2.5rem] border border-white/10 shadow-xl">
          <h3 className="text-xl font-bold tracking-tight mb-8">Plats Populaires</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topDishes} layout="vertical" margin={{ left: 0, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#fff" fontSize={10} width={100} axisLine={false} tickLine={false} />
                <Tooltip 
                   cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                   contentStyle={{ backgroundColor: '#264653', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                />
                <Bar dataKey="quantity" radius={[0, 10, 10, 0]} barSize={20}>
                  {data.topDishes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
              {data.topDishes.slice(0, 3).map((dish, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-xs font-bold truncate max-w-[120px]">{dish.name}</span>
                      <span className="text-xs font-mono text-teal font-bold">{dish.quantity} ventes</span>
                  </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
