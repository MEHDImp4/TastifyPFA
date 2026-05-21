import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { kdsApi } from '../../api/kds';
import { useKdsStore } from '../../store/kdsStore';
import { 
  Loader2, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  Timer,
  AlertTriangle,
  Maximize2
} from 'lucide-react';

const playDing = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
        console.error("Audio playback failed", e);
    }
};

export const KdsPage: React.FC = () => {
  const { tickets, setTickets, updateLigneStatut } = useKdsStore();
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const previousTicketsRef = useRef<number>(0);

  const fetchTickets = async () => {
    try {
      const res = await kdsApi.getActiveTickets();
      const transformed = res.data.map((cmd: any) => ({
        id: cmd.id,
        statut: cmd.statut,
        table_numero: cmd.table_numero,
        type: cmd.type,
        client_nom: cmd.client_nom,
        created_at: cmd.created_at,
        lignes: cmd.lignes.map((l: any) => ({
          id: l.id,
          plat_nom: l.plat_nom || `Plat #${l.plat}`,
          quantite: l.quantite,
          statut: l.statut,
          notes: l.notes,
          heure_lancement: l.heure_lancement
        }))
      }));
      setTickets(transformed);
      previousTicketsRef.current = transformed.length;
    } catch (err) {
      console.error('Failed to fetch KDS tickets', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && tickets.length > previousTicketsRef.current) {
        playDing();
    }
    previousTicketsRef.current = tickets.length;
  }, [tickets.length, isLoading]);

  const handleUpdateItem = async (ligneId: number, currentStatut: string) => {
    let nextStatut = '';
    if (currentStatut === 'EN_ATTENTE') nextStatut = 'EN_PREPARATION';
    else if (currentStatut === 'EN_PREPARATION') nextStatut = 'PRET';
    else return;

    try {
      await kdsApi.updateItemStatut(ligneId, nextStatut);
      updateLigneStatut(ligneId, nextStatut);
    } catch (err) {
      console.error('Failed to update item statut', err);
    }
  };

  const getElapsedTime = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = currentTime.getTime();
    const diff = Math.floor((now - start) / 60000);
    const secs = Math.floor(((now - start) % 60000) / 1000);
    return `${diff}m ${secs}s`;
  };

  const getTicketStatus = (ticket: any) => {
    const isCritical = (new Date().getTime() - new Date(ticket.created_at).getTime()) > 15 * 60000;
    if (isCritical && ticket.statut !== 'PRET') return 'CRITICAL';
    return ticket.statut;
  };

  const columns = [
    { id: 'EN_ATTENTE', label: 'INCOMING', icon: PlayCircle },
    { id: 'EN_PREPARATION', label: 'IN PROGRESS', icon: Timer },
    { id: 'PRET', label: 'READY TO PLATE', icon: CheckCircle2 },
    { id: 'CRITICAL', label: 'CRITICAL', icon: AlertTriangle, color: 'text-secondary' },
  ];

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/></div>;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden -m-staff-margin p-staff-margin selection:bg-primary/10 selection:text-primary">
      
      {/* Tactical KDS Header */}
      <header className="flex justify-between items-end mb-unit-lg border-b-2 border-on-surface pb-unit-sm shrink-0">
        <div>
          <h2 className="text-display-lg text-headline-md text-primary tracking-tight uppercase">Kitchen Display System</h2>
          <div className="flex items-center gap-unit-md mt-unit-xs">
            <span className="bg-primary text-on-primary px-unit-sm py-0.5 rounded text-[10px] font-black tracking-widest uppercase">Station: Hot Line</span>
            <span className="text-on-surface-variant font-black text-[10px] uppercase tracking-widest">Orders Active: {tickets.length}</span>
            <span className="text-on-surface-variant font-black text-[10px] uppercase tracking-widest">Avg Prep: 14m 20s</span>
          </div>
        </div>
        <div className="flex gap-unit-md">
          <div className="bg-surface-container-low border-2 border-on-surface px-6 py-2 rounded-lg flex items-center gap-4 shadow-[4px_4px_0px_#301400]">
            <Clock className="w-6 h-6 text-secondary" strokeWidth={2.5} />
            <span className="text-display-lg text-4xl leading-none font-black text-on-surface tabular-nums">
                {currentTime.toLocaleTimeString('en-GB', { hour12: false })}
            </span>
          </div>
        </div>
      </header>

      {/* Kanban Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-staff-gutter overflow-hidden h-full pb-unit-lg">
        {columns.map((col) => (
          <div key={col.id} className={`flex flex-col gap-unit-md h-full min-w-[300px] ${col.id === 'CRITICAL' ? 'bg-secondary/5 rounded-xl border-2 border-secondary/20 p-2' : ''}`}>
            <div className="flex items-center justify-between px-unit-sm py-2">
                <div className="flex items-center gap-3">
                    <col.icon className={`w-5 h-5 ${col.color || 'text-on-surface'}`} strokeWidth={2.5} />
                    <h3 className={`text-ui-label-bold text-[12px] font-black tracking-[0.2em] uppercase ${col.color || 'text-on-surface'}`}>
                        {col.label}
                    </h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${col.id === 'CRITICAL' ? 'bg-secondary text-on-secondary' : 'bg-on-surface text-background'}`}>
                    {tickets.filter(t => getTicketStatus(t) === col.id).length}
                </span>
            </div>

            <div className="flex-1 space-y-unit-md overflow-y-auto custom-scrollbar pr-2">
                <AnimatePresence mode="popLayout">
                    {tickets.filter(t => getTicketStatus(t) === col.id).map((ticket) => (
                        <motion.div 
                            key={ticket.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={`
                                group bg-background border-2 p-unit-md rounded-lg flex flex-col gap-unit-sm transition-all duration-300
                                ${col.id === 'CRITICAL' ? 'border-secondary shadow-xl shadow-secondary/10' : 'border-on-surface shadow-[4px_4px_0px_#301400/5] hover:shadow-[6px_6px_0px_#301400/10]'}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className={`text-[11px] font-black tracking-widest uppercase ${col.id === 'CRITICAL' ? 'text-secondary' : 'text-primary'}`}>
                                        #ORD-{ticket.id}
                                    </span>
                                    <h4 className={`text-lg font-black tracking-tight leading-none mt-1 ${col.id === 'CRITICAL' ? 'text-on-surface' : 'text-on-surface'}`}>
                                        {ticket.type === 'SUR_PLACE' ? `Table ${ticket.table_numero || '?'}` : `Client ${ticket.client_nom || 'UNK'}`}
                                    </h4>
                                </div>
                                <div className={`
                                    px-3 py-1 rounded font-black text-xs tabular-nums
                                    ${col.id === 'CRITICAL' ? 'bg-secondary text-on-secondary animate-pulse' : 'bg-surface-container-high text-on-surface'}
                                `}>
                                    {getElapsedTime(ticket.created_at)}
                                </div>
                            </div>

                            <div className={`border-t border-dashed my-2 ${col.id === 'CRITICAL' ? 'border-secondary/30' : 'border-on-surface/10'}`} />

                            <ul className="space-y-3">
                                {ticket.lignes.map((item) => (
                                    <li key={item.id} className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3 group/item cursor-pointer" onClick={() => handleUpdateItem(item.id, item.statut)}>
                                            <div className={`
                                                w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                                                ${item.statut === 'PRET' ? 'bg-primary border-primary' : 'border-on-surface/20 group-hover/item:border-primary'}
                                            `}>
                                                {item.statut === 'PRET' && <CheckCircle2 className="w-3.5 h-3.5 text-on-primary" strokeWidth={3} />}
                                            </div>
                                            <span className={`text-sm font-black tracking-tight uppercase ${item.statut === 'PRET' ? 'text-on-surface-variant/40 line-through' : 'text-on-surface'}`}>
                                                {item.quantite}x {item.plat_nom}
                                            </span>
                                        </div>
                                        {item.notes && (
                                            <div className="ml-8 text-[9px] font-black text-secondary bg-secondary/5 px-2 py-1 rounded border border-secondary/10 w-max uppercase">
                                                NOTE: {item.notes}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-4 flex items-center justify-between">
                                {col.id === 'EN_PREPARATION' && (
                                    <div className="h-1.5 flex-1 bg-surface-container rounded-full overflow-hidden border border-on-surface/10 mr-4">
                                        <motion.div 
                                            className="h-full bg-primary" 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(ticket.lignes.filter(l => l.statut === 'PRET').length / ticket.lignes.length) * 100}%` }}
                                        />
                                    </div>
                                )}
                                {ticket.lignes.every(l => l.statut === 'PRET') ? (
                                    <button 
                                        className="w-full bg-primary text-on-primary text-[10px] font-black uppercase tracking-[0.3em] py-3 rounded hover:bg-primary-container transition-all"
                                        onClick={() => {/* Final push logic */}}
                                    >
                                        Push to Window
                                    </button>
                                ) : (
                                    <div className="flex justify-end w-full">
                                         <button className={`text-[9px] font-black uppercase tracking-widest hover:underline ${col.id === 'CRITICAL' ? 'text-secondary' : 'text-on-surface-variant'}`}>
                                            Expand Orchestration
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {tickets.filter(t => getTicketStatus(t) === col.id).length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant opacity-10 gap-4">
                        <Maximize2 className="w-8 h-8" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Sector Clear</span>
                    </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

