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
  Server,
  Activity
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
    <div className="h-full flex flex-col bg-background font-body selection:bg-on-background/10 overflow-hidden">
      
      {/* Page Header */}
      <header className="flex-none flex items-center justify-between px-8 h-20 border-b border-outline bg-surface">
        <div>
          <h1 aria-label="Santé Système" className="text-sm font-bold tracking-widest text-on-background uppercase">État du Système</h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-40">Télémétrie temps réel et état des modules</p>
        </div>
        <div className="flex gap-4 items-center">
          <button className="btn-ghost h-10 px-4">
            <Download className="w-3.5 h-3.5" /> <span>Exporter Logs</span>
          </button>
          <button className="btn-primary h-10 px-6">
            <RotateCcw className="w-4 h-4" /> <span>Sync Manuelle</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 bg-background custom-scrollbar space-y-8">
        
        {/* Module Health Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="atelier-card p-6 flex flex-col justify-between h-40 group hover:border-on-background">
              <div className="flex justify-between items-start">
                 <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2"><Server className="w-3.5 h-3.5" /> Noyau Cuisine</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
              </div>
              <div className="mt-auto">
                 <div className="text-2xl font-bold text-on-background">En Ligne</div>
                 <div className="flex justify-between text-[8px] font-bold text-on-surface-variant uppercase tracking-widest mt-2 opacity-40">
                    <span>Lat: 12ms</span>
                    <span>Up: 99.9%</span>
                 </div>
              </div>
           </div>

           <div className="atelier-card p-6 flex flex-col justify-between h-40 group hover:border-on-background">
              <div className="flex justify-between items-start">
                 <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2"><Network className="w-3.5 h-3.5" /> Comm. Salle</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
              </div>
              <div className="mt-auto">
                 <div className="text-2xl font-bold text-on-background">En Ligne</div>
                 <div className="flex justify-between text-[8px] font-bold text-on-surface-variant uppercase tracking-widest mt-2 opacity-40">
                    <span>Lat: 8ms</span>
                    <span>Nodes: 14</span>
                 </div>
              </div>
           </div>

           <div className="atelier-card p-6 flex flex-col justify-between h-40 border-error/20 bg-error/[0.01]">
              <div className="flex justify-between items-start">
                 <span className="text-[9px] font-bold text-error uppercase tracking-widest flex items-center gap-2"><Cpu className="w-3.5 h-3.5" /> API Gateway</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></div>
              </div>
              <div className="mt-auto">
                 <div className="text-2xl font-bold text-error">Dégradé</div>
                 <div className="flex justify-between text-[8px] font-bold text-error/40 uppercase tracking-widest mt-2">
                    <span>Lat: 145ms</span>
                    <span>Err: 2.1%</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           {/* Event Log */}
           <div className="lg:col-span-8 atelier-card flex flex-col h-[480px] overflow-hidden">
              <div className="px-6 h-12 border-b border-outline bg-surface-container-high flex items-center justify-between text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
                 <span className="flex items-center gap-2"><Terminal className="w-3.5 h-3.5" /> Journal Événements</span>
                 <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-background border border-outline">
                    <Activity className="w-2.5 h-2.5" />
                    <span>Temps réel</span>
                 </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-3 bg-background">
                 {logs.map((log, i) => (
                    <div key={i} className="flex gap-6 group items-start">
                       <span className="text-on-surface-variant/40 w-16 shrink-0">{log.time}</span>
                       <span className={`w-12 shrink-0 font-bold ${log.status === 'ERROR' ? 'text-error' : 'text-on-background opacity-40'}`}>[{log.status}]</span>
                       <span className="text-on-surface-variant group-hover:text-on-background transition-colors uppercase tracking-tight">{log.msg}</span>
                    </div>
                 ))}
                 <div className="text-on-background opacity-20">_</div>
              </div>
           </div>

           {/* Technical Context */}
           <div className="lg:col-span-4 space-y-8">
              <div className="atelier-card p-8 space-y-6">
                 <h3 className="text-[10px] font-bold text-on-background uppercase tracking-widest border-b border-outline pb-4">Environnement</h3>
                 <ul className="space-y-4 text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                    <li className="flex justify-between"><span>Version</span><span className="text-on-background">Terminal v1.4.2</span></li>
                    <li className="flex justify-between"><span>Instance</span><span className="text-on-background">i-0a1b2c3d4e</span></li>
                    <li className="flex justify-between"><span>Region</span><span className="text-on-background">MA-CAS-1</span></li>
                    <li className="flex justify-between"><span>Dernier Démarrage</span><span className="text-on-background">Il y a 4 jours</span></li>
                 </ul>
              </div>

              <div className="atelier-card p-8 bg-surface-container-high border-outline">
                 <h3 className="text-[10px] font-bold text-on-background uppercase tracking-widest flex items-center gap-2 mb-4"><Database className="w-4 h-4" /> Support Technique</h3>
                 <p className="text-[11px] text-on-surface-variant leading-relaxed opacity-60 uppercase mb-8">Pour les pannes critiques ou matérielles ne pouvant être résolues par un redémarrage, contactez le support de niveau 2 immédiatement.</p>
                 <div className="space-y-3">
                    <button className="w-full flex items-center gap-4 p-4 border border-outline rounded-lg hover:bg-background transition-all group">
                       <Phone className="w-4 h-4 text-on-surface-variant group-hover:text-on-background" />
                       <span className="text-[9px] font-bold text-on-surface-variant group-hover:text-on-background uppercase tracking-widest">1-800-TASTIFY</span>
                    </button>
                    <button className="w-full flex items-center gap-4 p-4 border border-outline rounded-lg hover:bg-background transition-all group">
                       <Mail className="w-4 h-4 text-on-surface-variant group-hover:text-on-background" />
                       <span className="text-[9px] font-bold text-on-surface-variant group-hover:text-on-background uppercase tracking-widest">noc@tastify.inc</span>
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

