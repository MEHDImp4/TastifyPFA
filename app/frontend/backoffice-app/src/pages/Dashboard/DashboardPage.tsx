import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../api/analytics';
import type { DashboardData } from '../../api/analytics';
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
  Clock,
  Loader2
} from 'lucide-react';
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

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/></div>;
  if (!data) return <div className="text-center py-20 text-on-surface-variant font-sans font-bold uppercase text-[10px]">Data registry offline.</div>;

  const kpis = [
    { label: "Revenue", value: `${data.todayRevenue.toFixed(0)} DH`, icon: TrendingUp, trend: "+8.4%", color: "text-primary" },
    { label: "Occupancy", value: `${Math.round((data.activeTables / 28) * 100)}%`, icon: Users, trend: "24/28 Tbl", color: "text-primary" },
    { label: "Pending Orders", value: data.pendingOrders, icon: ShoppingBag, trend: "3 Priority", color: "text-primary", border: "border-l-4 border-l-primary" },
    { label: "Avg Prep Time", value: `${data.avgPrepTime}m`, icon: Timer, trend: "+2m delay", color: "text-error" },
  ];

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
            <div className={`font-sans text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${kpi.trend.includes('+') ? 'text-primary' : 'text-on-surface-variant opacity-60'}`}>
              <Activity className="w-3 h-3" /> {kpi.trend}
            </div>
          </div>
        ))}
      </section>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-staff-gutter flex-1">
        
        {/* Left Column: Live Feed & Map (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-staff-gutter h-full">
          
          {/* Live Feed Alerts */}
          <div className="bg-surface-container border border-outline-variant rounded-lg flex flex-col flex-1 min-h-[350px] shadow-sm">
            <div className="p-4 border-b border-outline-variant bg-surface-container-high flex justify-between items-center rounded-t-lg">
              <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em]">Live Feed Alerts</h3>
              <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
            </div>
            <div className="p-unit-sm flex flex-col gap-2 overflow-y-auto custom-scrollbar">
              {[
                { type: 'error', label: 'Check Requested', desc: 'Table 4 • 2m ago', icon: BellRing },
                { type: 'warning', label: 'Order Delayed', desc: 'Order #8542 • 5m over target', icon: Clock },
                { type: 'primary', label: 'Low Stock', desc: 'Wagyu A5 • 3 portions left', icon: ShoppingBag },
                { type: 'success', label: 'Table Clear', desc: 'Table 12 reset complete', icon: CheckCircle2 }
              ].map((alert, idx) => (
                <div key={idx} className={`p-4 border-l-4 rounded bg-surface-main flex items-start gap-4 transition-all hover:translate-x-1 ${alert.type === 'error' ? 'border-error' : alert.type === 'warning' ? 'border-primary' : 'border-primary-container'}`}>
                   <alert.icon className={`w-4 h-4 mt-0.5 ${alert.type === 'error' ? 'text-error' : 'text-primary'}`} />
                   <div>
                      <p className="font-sans text-[12px] font-black text-on-surface uppercase tracking-tight leading-none">{alert.label}</p>
                      <p className="font-sans text-[10px] text-on-surface-variant mt-1.5 uppercase tracking-widest opacity-60">{alert.desc}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floor Plan Preview */}
          <div className="bg-surface-container border border-outline-variant rounded-lg flex flex-col h-[280px] shadow-sm">
            <div className="p-4 border-b border-outline-variant bg-surface-container-high flex justify-between items-center rounded-t-lg">
              <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em]">Floor Plan Preview</h3>
              <button className="text-on-surface-variant hover:text-primary transition-colors"><Maximize2 className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 p-4 bg-surface-main relative flex items-center justify-center overflow-hidden rounded-b-lg blueprint-grid">
              <div className="w-full h-full border border-dashed border-outline-variant/30 relative p-4 opacity-40">
                <div className="absolute top-4 left-4 w-10 h-10 rounded border-2 border-error bg-error/10" />
                <div className="absolute top-4 right-4 w-10 h-10 rounded border-2 border-primary bg-primary/10" />
                <div className="absolute bottom-4 left-4 w-16 h-10 rounded-full border-2 border-outline-variant bg-surface-container-highest" />
                <div className="absolute bottom-4 right-4 w-12 h-12 rounded border-2 border-outline-variant bg-surface-container-highest" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-on-surface-variant font-sans text-[9px] font-black uppercase tracking-[0.4em] text-center">Dining Zone Alpha</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Tickets Kanban (8 cols) */}
        <div className="lg:col-span-8 bg-surface-container border border-outline-variant rounded-lg flex flex-col min-h-[650px] shadow-2xl">
          <div className="p-4 border-b border-outline-variant bg-surface-container-high flex justify-between items-center rounded-t-lg">
            <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em]">Live Orchestration Feed</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 border border-outline-variant rounded font-sans text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-highest">Filter</button>
              <button className="px-4 py-1.5 bg-primary text-on-primary rounded font-sans text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">New Ticket</button>
            </div>
          </div>
          
          <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto custom-scrollbar">
            {/* Kanban Columns */}
            {[
              { id: 'prep', label: 'Preparing', count: 4, color: 'text-on-surface-variant' },
              { id: 'late', label: 'Delayed', count: 1, color: 'text-primary' },
              { id: 'ready', label: 'Ready', count: 2, color: 'text-on-surface-variant' }
            ].map(col => (
              <div key={col.id} className="bg-surface-main/50 border border-outline-variant rounded flex flex-col p-3 min-w-[240px]">
                <h4 className={`font-sans text-[11px] font-black uppercase tracking-widest mb-4 px-1 flex justify-between items-center ${col.color}`}>
                  {col.label}
                  <span className="bg-surface-container-highest px-2 py-0.5 rounded text-[10px] border border-outline-variant/30">{col.count}</span>
                </h4>
                <div className="flex flex-col gap-3">
                  {col.id === 'prep' && (
                    <>
                      <div className="bg-surface-container border border-outline-variant p-4 rounded flex flex-col gap-3 shadow-sm hover:border-primary transition-all cursor-pointer">
                        <div className="flex justify-between items-center">
                          <span className="font-sans text-xs font-black text-on-surface uppercase tracking-tight">#ORD-8543</span>
                          <span className="bg-surface-container-highest px-2 py-0.5 rounded text-[9px] font-black border border-outline-variant/50">TBL 12</span>
                        </div>
                        <ul className="font-sans text-[11px] font-bold text-on-surface-variant space-y-1 opacity-80 uppercase tracking-tight">
                          <li>• 2x Truffle Risotto</li>
                          <li>• 1x Wagyu A5 Ribeye</li>
                        </ul>
                        <div className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-1.5 pt-2 border-t border-outline-variant/20">
                          <Timer className="w-3.5 h-3.5" /> 4m elapsed
                        </div>
                      </div>
                    </>
                  )}
                  {col.id === 'late' && (
                    <div className="bg-surface-container border border-primary p-4 rounded flex flex-col gap-3 shadow-xl shadow-primary/5 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                      <div className="flex justify-between items-center pl-2">
                        <span className="font-sans text-xs font-black text-on-surface uppercase tracking-tight">#ORD-8542</span>
                        <span className="bg-primary text-on-primary px-2 py-0.5 rounded text-[9px] font-black uppercase">TBL 02</span>
                      </div>
                      <ul className="font-sans text-[11px] font-bold text-on-surface-variant space-y-1 pl-2 uppercase tracking-tight">
                        <li>• 1x Tasting Menu</li>
                        <li className="text-primary">• 1x Wine Pairing (WAIT)</li>
                      </ul>
                      <div className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-1.5 pt-2 border-t border-primary/20 pl-2">
                        <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> 18m elapsed
                      </div>
                    </div>
                  )}
                  {col.id === 'ready' && (
                    <div className="bg-surface-container border border-outline-variant p-4 rounded flex flex-col gap-3 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span className="font-sans text-xs font-black text-on-surface line-through">#ORD-8540</span>
                        <span className="bg-surface-container-highest px-2 py-0.5 rounded text-[9px] font-black border border-outline-variant/50">TBL 05</span>
                      </div>
                      <div className="text-[10px] text-success font-black uppercase tracking-widest flex items-center gap-1.5 pt-2 border-t border-outline-variant/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Waiting for pickup
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-outline-variant bg-surface-container-high flex justify-center rounded-b-lg">
             <button className="font-sans text-[10px] font-black uppercase tracking-[0.4em] text-primary hover:text-on-surface transition-all flex items-center gap-2">
                Access Full Command Interface <ChevronRight className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};


