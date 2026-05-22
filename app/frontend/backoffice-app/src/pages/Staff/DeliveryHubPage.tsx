import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  Search, 
  Filter, 
  Timer,
  Navigation,
  Smartphone,
  TrendingUp,
  History,
  Activity,
  RotateCcw
} from 'lucide-react';

export const DeliveryHubPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const kpis = [
    { label: "OFF-PREMISE REVENUE", value: "4,290 DH", icon: TrendingUp, trend: "+12.4%", color: "text-primary" },
    { label: "AVG. PREP TIME", value: "14.2m", icon: Timer, trend: "+2m lag", color: "text-error" },
    { label: "DRIVER SATISFACTION", value: "4.92", icon: CheckCircle2, trend: "Top 5%", color: "text-primary" },
    { label: "CANCELLATION RATE", value: "0.4%", icon: History, trend: "Nominal", color: "text-on-surface-variant" },
  ];

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/></div>;

  return (
    <div className="h-full flex flex-col bg-surface-main -m-staff-margin p-0 font-body selection:bg-primary/20 overflow-hidden">
      
      {/* Tactical Top Bar */}
      <header className="flex-none flex items-center justify-between border-b border-outline-variant bg-surface-container px-staff-margin h-16 z-30">
        <div className="flex items-center gap-unit-lg">
          <div className="flex flex-col">
            <h2 className="font-serif text-xl font-black text-primary uppercase italic leading-none m-0">Delivery Hub</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
              <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">SYSTEMS NOMINAL • 14 ACTIVE</span>
            </div>
          </div>
          <div className="h-8 w-px bg-outline-variant/30 mx-4 hidden md:block" />
          <div className="hidden md:flex gap-3 items-center">
            <span className="font-sans text-[10px] font-black text-on-surface-variant px-3 py-1 border border-outline-variant rounded bg-surface-container-low uppercase tracking-widest">UBER: 4</span>
            <span className="font-sans text-[10px] font-black text-on-surface-variant px-3 py-1 border border-outline-variant rounded bg-surface-container-low uppercase tracking-widest">GLOVO: 6</span>
            <span className="font-sans text-[10px] font-black text-on-surface-variant px-3 py-1 border border-outline-variant rounded bg-surface-container-low uppercase tracking-widest">DIRECT: 4</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative group hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <input 
              type="text" placeholder="Search orders..."
              className="w-64 h-10 bg-surface-container-highest border border-outline-variant rounded pl-10 pr-4 font-sans text-xs font-bold text-on-surface focus:border-primary outline-none transition-all uppercase placeholder:text-on-surface-variant/20"
            />
          </div>
          <div className="flex gap-4">
             <button className="text-on-surface-variant hover:text-primary transition-colors"><Activity className="w-5 h-5" /></button>
             <div className="w-8 h-8 rounded bg-surface-bright border border-outline-variant overflow-hidden shadow-inner">
                <span className="w-full h-full flex items-center justify-center font-sans font-black text-[10px] text-primary">OP</span>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-staff-margin bg-surface-container-lowest custom-scrollbar space-y-staff-margin">
        
        {/* Metric Row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-unit-md">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-surface-container border border-outline-variant rounded-lg p-6 flex flex-col justify-between shadow-sm transition-all hover:bg-surface-container-high group">
              <div className="flex justify-between items-start">
                <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">{kpi.label}</span>
                <kpi.icon className={`w-4 h-4 ${kpi.color} opacity-40 group-hover:opacity-100 transition-all`} />
              </div>
              <div className="mt-4">
                <div className="font-serif text-2xl font-black text-on-surface tabular-nums">{kpi.value}</div>
                <div className={`font-sans text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-1 ${kpi.color}`}>
                  {kpi.trend}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Dispatch Grid */}
        <div className="bg-surface-main border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-2xl">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container flex items-center justify-between">
             <div className="flex gap-6">
                <button className="font-sans text-[11px] font-black text-primary border-b-2 border-primary pb-1 uppercase tracking-[0.2em]">All Active (14)</button>
                <button className="font-sans text-[11px] font-black text-on-surface-variant hover:text-on-surface transition-colors uppercase tracking-[0.2em] opacity-40">Preparing (6)</button>
                <button className="font-sans text-[11px] font-black text-on-surface-variant hover:text-on-surface transition-colors uppercase tracking-[0.2em] opacity-40">En Route (5)</button>
             </div>
             <div className="flex gap-4">
                <Filter className="w-4 h-4 text-on-surface-variant cursor-pointer hover:text-primary transition-colors" />
                <RotateCcw className="w-4 h-4 text-on-surface-variant cursor-pointer hover:text-primary transition-colors" />
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-[0.3em]">
                  <th className="py-4 px-6">Time</th>
                  <th className="py-4 px-6">Channel</th>
                  <th className="py-4 px-6">Order ID</th>
                  <th className="py-4 px-6">Items</th>
                  <th className="py-4 px-6">Status / Courier</th>
                  <th className="py-4 px-6 text-right">Value</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 font-sans text-[13px] font-bold text-on-surface">
                {[
                  { time: '19:42', channel: 'UBER', id: '#UBR-8812', courier: 'Marcus T.', desc: 'Wagyu Burger (x2), Dirty Fries...', status: 'PREPARING', val: '114 DH', urgent: true },
                  { time: '19:35', channel: 'GLOVO', id: '#GLV-0492', courier: 'Sarah J.', desc: 'Miso Ramen, Gyoza (Set 12)', status: 'READY', val: '68 DH', urgent: false },
                  { time: '19:22', channel: 'DIRECT', id: '#TST-0012', courier: 'James L.', desc: 'Lobster Linguine, Burrata', status: 'EN ROUTE', val: '184 DH', urgent: false }
                ].map((order, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low transition-colors group">
                    <td className={`py-4 px-6 tabular-nums ${order.urgent ? 'text-primary' : 'opacity-40'}`}>{order.time}</td>
                    <td className="py-4 px-6">
                       <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase text-white ${order.channel === 'UBER' ? 'bg-[#06C167]' : order.channel === 'GLOVO' ? 'bg-[#FFC244] text-[#1D1D1D]' : 'bg-primary'}`}>{order.channel}</span>
                    </td>
                    <td className="py-4 px-6">
                       <div className="font-black text-on-surface">{order.id}</div>
                       <div className="text-[10px] opacity-40 uppercase tracking-widest">{order.courier}</div>
                    </td>
                    <td className="py-4 px-6 opacity-60 uppercase text-[11px] truncate max-w-[200px]">{order.desc}</td>
                    <td className="py-4 px-6">
                       <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${order.status === 'READY' ? 'bg-success' : 'bg-primary animate-pulse'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${order.status === 'READY' ? 'text-success' : 'text-primary'}`}>{order.status}</span>
                       </div>
                       <div className="text-[10px] opacity-40 uppercase tracking-widest mt-1">Est. arrival: 20:05</div>
                    </td>
                    <td className="py-4 px-6 text-right font-black tabular-nums text-primary">{order.val}</td>
                    <td className="py-4 px-6 text-right">
                       <button className="px-4 py-1.5 border border-outline-variant rounded font-sans text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Auxiliary Dispatch Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-staff-gutter">
           <div className="lg:col-span-8 bg-surface-container border border-outline-variant rounded-lg p-8 space-y-6 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em]">Active Delivery Radius</h3>
                 <span className="font-sans text-[9px] font-black text-on-surface-variant bg-background px-3 py-1 rounded border border-outline-variant uppercase tracking-widest opacity-60">LIVE MONITORING</span>
              </div>
              <div className="h-64 bg-[#15110e] rounded-lg border border-outline-variant relative overflow-hidden blueprint-grid">
                 <div className="absolute inset-0 flex items-center justify-center opacity-20 grayscale pointer-events-none">
                    <Navigation className="w-32 h-32 text-primary stroke-[0.5]" />
                 </div>
                 <div className="absolute bottom-6 left-6 right-6 flex justify-between">
                    <div className="bg-background/80 backdrop-blur-md p-4 rounded border border-outline-variant/30">
                       <p className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Density</p>
                       <p className="font-sans text-xs font-bold text-primary uppercase">Downtown Zone Alpha: High</p>
                    </div>
                    <div className="bg-background/80 backdrop-blur-md p-4 rounded border border-outline-variant/30">
                       <p className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Traffic</p>
                       <p className="font-sans text-xs font-bold text-error uppercase">+4m peak lag detected</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-lg p-8 space-y-8 shadow-sm flex flex-col">
              <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em] border-b border-outline-variant/30 pb-4">Courier Wait List</h3>
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                 {[
                   { name: 'Ricardo M.', channel: 'UberEats', wait: '1.2m', id: 'RM' },
                   { name: 'Lina C.', channel: 'Glovo', wait: '4.5m', id: 'LC' },
                   { name: 'Tom K.', channel: 'Direct', wait: 'Near Store', id: 'TK' }
                 ].map((courier, i) => (
                   <div key={i} className={`p-4 bg-surface-main border border-outline-variant rounded flex items-center justify-between group hover:border-primary transition-all ${i === 2 ? 'opacity-40 grayscale' : ''}`}>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded bg-surface-container-highest flex items-center justify-center font-sans font-black text-[11px] text-on-surface-variant shadow-inner group-hover:text-primary transition-colors">{courier.id}</div>
                         <div>
                            <p className="font-sans text-[12px] font-black text-on-surface uppercase tracking-tight">{courier.name}</p>
                            <p className="font-sans text-[9px] text-on-surface-variant uppercase tracking-widest opacity-60">{courier.channel} • {courier.wait}</p>
                         </div>
                      </div>
                      <Smartphone className={`w-4 h-4 ${i === 2 ? 'text-on-surface-variant' : 'text-success'} opacity-40`} />
                   </div>
                 ))}
              </div>
              <button className="w-full py-4 border border-outline-variant rounded-lg font-sans text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-all">Audit Dispatch Log</button>
           </div>
        </div>
      </main>
    </div>
  );
};
