import React from 'react';
import { 
  Terminal, 
  Cpu, 
  Network, 
  Database,
  Download,
  RotateCcw,
  Phone,
  Mail,
  Server
} from 'lucide-react';

export const MaintenancePage: React.FC = () => {

  const logs = [
    { time: '14:02:11', status: 'INFO', msg: 'Database connection verified. Pool size: 50.' },
    { time: '14:02:15', status: 'INFO', msg: 'Routine memory garbage collection triggered.' },
    { time: '14:03:01', status: 'WARN', msg: 'High latency detected on Payment Gateway API (142ms).' },
    { time: '14:03:05', status: 'INFO', msg: 'Payment Gateway request resolved.' },
    { time: '14:05:22', status: 'INFO', msg: 'New staff session authenticated: UserID 492.' },
    { time: '14:12:18', status: 'ERROR', msg: 'Floor node 04 dropped connection unexpectedly.' },
    { time: '14:12:22', status: 'INFO', msg: 'Floor node 04 reconnected successfully.' },
  ];

  return (
    <div className="h-full flex flex-col bg-background font-body selection:bg-primary/20 overflow-hidden">
      
      {/* Page Header */}
      <header className="flex-none flex items-end justify-between px-staff-margin py-unit-lg border-b border-outline-variant bg-surface-main">
        <div>
          <h1 className="font-serif text-3xl font-black text-on-surface tracking-tighter uppercase">System Health</h1>
          <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-1">Real-time telemetry and module status</p>
        </div>
        <div className="flex gap-unit-md items-center">
          <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded font-sans text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-all">
            <Download className="w-3.5 h-3.5" /> Export Logs
          </button>
          <button className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded font-sans text-xs font-black uppercase tracking-wider hover:scale-[1.02] transition-all">
            <RotateCcw className="w-4 h-4" /> Manual Sync
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-staff-margin bg-surface-container-lowest custom-scrollbar space-y-staff-margin">
        
        {/* Module Health Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-unit-md">
           <div className="bg-surface-container border border-outline-variant rounded-lg p-6 flex flex-col justify-between h-40 relative overflow-hidden group hover:border-primary transition-all">
              <div className="flex justify-between items-start">
                 <span className="font-sans text-[10px] font-black text-on-surface uppercase tracking-widest flex items-center gap-2"><Server className="w-3.5 h-3.5" /> Kitchen Core</span>
                 <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              </div>
              <div className="mt-auto">
                 <div className="font-serif text-3xl font-black text-on-surface">Online</div>
                 <div className="flex justify-between font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest mt-2">
                    <span>Lat: 12ms</span>
                    <span>Up: 99.9%</span>
                 </div>
              </div>
           </div>

           <div className="bg-surface-container border border-outline-variant rounded-lg p-6 flex flex-col justify-between h-40 relative overflow-hidden group hover:border-primary transition-all">
              <div className="flex justify-between items-start">
                 <span className="font-sans text-[10px] font-black text-on-surface uppercase tracking-widest flex items-center gap-2"><Network className="w-3.5 h-3.5" /> Floor Comm</span>
                 <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              </div>
              <div className="mt-auto">
                 <div className="font-serif text-3xl font-black text-on-surface">Online</div>
                 <div className="flex justify-between font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest mt-2">
                    <span>Lat: 8ms</span>
                    <span>Nodes: 14</span>
                 </div>
              </div>
           </div>

           <div className="bg-primary/10 border-2 border-primary/40 rounded-lg p-6 flex flex-col justify-between h-40 relative overflow-hidden">
              <div className="flex justify-between items-start">
                 <span className="font-sans text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><Cpu className="w-3.5 h-3.5" /> API Gateway</span>
                 <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="mt-auto">
                 <div className="font-serif text-3xl font-black text-primary">Degraded</div>
                 <div className="flex justify-between font-sans text-[9px] font-black text-primary/60 uppercase tracking-widest mt-2">
                    <span>Lat: 145ms</span>
                    <span>Err: 2.1%</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-staff-gutter">
           {/* Event Log */}
           <div className="lg:col-span-8 bg-surface-main border border-outline-variant rounded-lg flex flex-col h-[450px] overflow-hidden">
              <div className="px-6 py-3 border-b border-outline-variant bg-surface-container flex items-center justify-between font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
                 <span className="flex items-center gap-2"><Terminal className="w-3.5 h-3.5" /> System Event Log</span>
                 <div className="flex gap-1.5 opacity-20">
                    <div className="w-1.5 h-1.5 rounded-full bg-on-surface" />
                    <div className="w-1.5 h-1.5 rounded-full bg-on-surface" />
                    <div className="w-1.5 h-1.5 rounded-full bg-on-surface" />
                 </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-2 bg-surface-container-lowest/50">
                 {logs.map((log, i) => (
                    <div key={i} className="flex gap-6 group">
                       <span className="text-on-surface-variant/30 w-16 shrink-0">{log.time}</span>
                       <span className={`w-12 shrink-0 font-bold ${log.status === 'INFO' ? 'text-primary/40' : log.status === 'WARN' ? 'text-primary' : 'text-error'}`}>[{log.status}]</span>
                       <span className="text-on-surface opacity-80 group-hover:opacity-100 transition-opacity uppercase tracking-tight">{log.msg}</span>
                    </div>
                 ))}
                 <div className="animate-pulse text-primary/40">_</div>
              </div>
           </div>

           {/* Sidebar Info */}
           <div className="lg:col-span-4 space-y-staff-gutter">
              <div className="bg-surface-container border border-outline-variant rounded-lg p-8 space-y-8">
                 <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em] border-b border-outline-variant/30 pb-4">Environment</h3>
                 <ul className="space-y-4 font-sans text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    <li className="flex justify-between"><span>Version</span><span className="text-on-surface">Terminal v1.4.2</span></li>
                    <li className="flex justify-between"><span>Instance</span><span className="text-on-surface">i-0a1b2c3d4e</span></li>
                    <li className="flex justify-between"><span>Region</span><span className="text-on-surface">MA-CAS-1</span></li>
                    <li className="flex justify-between"><span>Last Boot</span><span className="text-on-surface">4 Days Ago</span></li>
                 </ul>
              </div>

              <div className="bg-surface-container-high border border-outline-variant rounded-lg p-8 space-y-6 flex-1">
                 <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em] flex items-center gap-2"><Database className="w-4 h-4" /> Technical Support</h3>
                 <p className="font-body text-[13px] text-on-surface-variant italic opacity-60 uppercase tracking-tight leading-relaxed">For critical outages or hardware failures that cannot be resolved via restart, contact Level 2 support immediately.</p>
                 <div className="space-y-3 pt-4">
                    <button className="w-full flex items-center gap-4 p-4 border border-outline-variant/30 rounded-xl hover:bg-surface-container-highest transition-all group">
                       <Phone className="w-4 h-4 text-primary" />
                       <span className="font-sans text-[10px] font-black text-on-surface uppercase tracking-widest">1-800-TASTIFY</span>
                    </button>
                    <button className="w-full flex items-center gap-4 p-4 border border-outline-variant/30 rounded-xl hover:bg-surface-container-highest transition-all group">
                       <Mail className="w-4 h-4 text-primary" />
                       <span className="font-sans text-[10px] font-black text-on-surface uppercase tracking-widest">noc@tastify.inc</span>
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};
