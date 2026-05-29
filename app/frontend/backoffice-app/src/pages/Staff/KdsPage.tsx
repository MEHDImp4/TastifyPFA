import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { kdsApi } from '../../api/kds';
import { useKdsStore } from '../../store/kdsStore';
import { 
  Loader2, 
  ArrowLeft,
  Timer,
  CheckCircle2,
  RotateCcw,
  Check,
  Zap,
  PlayCircle
} from 'lucide-react';

// --- Utilitaires ---
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
        console.error("Erreur audio", e);
    }
};

// --- Composant Chronomètre Isolé ---
const TicketTimer = ({ createdAt, onCritical }: { createdAt: string, onCritical: (val: boolean) => void }) => {
    const [elapsed, setElapsed] = useState('');
    const [isRush, setIsRush] = useState(false);

    useEffect(() => {
        const calculateTime = () => {
            const start = new Date(createdAt).getTime();
            const now = Date.now();
            const totalSeconds = Math.floor((now - start) / 1000);
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            
            const rush = (now - start) > 15 * 60000;
            if (rush !== isRush) {
                setIsRush(rush);
                onCritical(rush);
            }
            
            setElapsed(`${mins}m ${secs.toString().padStart(2, '0')}s`);
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [createdAt, isRush, onCritical]);

    return (
        <span className={`font-mono text-2xl font-black tabular-nums tracking-tighter ${isRush ? 'text-error' : 'text-primary'}`}>
            {elapsed}
        </span>
    );
};

// --- Composant Ticket KDS ---
const KdsTicket = ({ 
    ticket, 
    onUpdateItem, 
    onUpdateCommand 
}: { 
    ticket: any, 
    onUpdateItem: (id: number, statut: string) => void,
    onUpdateCommand: (id: number, statut: string, forceReady?: boolean) => void
}) => {
    const [isCritical, setIsCritical] = useState(false);
    const allLignesReady = ticket.lignes.every((l: any) => l.statut === 'PRET');
    const isDone = ticket.statut === 'PRETE';

    const statusBg = isDone ? 'bg-success/5' : (isCritical ? 'bg-error/5' : 'bg-surface-container-low');

    const handleMainAction = () => {
        if (isDone) {
            onUpdateCommand(ticket.id, ticket.statut);
        } else if (allLignesReady) {
            onUpdateCommand(ticket.id, ticket.statut);
        } else {
            onUpdateCommand(ticket.id, ticket.statut, true);
        }
    };

    return (
        <div className={`luxury-card flex flex-col overflow-hidden shrink-0 mb-6 transition-all ${isCritical && !isDone ? 'ring-2 ring-error/20 border-error/30' : 'border-outline-variant'}`}>
            
            {/* En-tête du Ticket */}
            <div className={`p-5 ${statusBg} border-b border-outline-variant flex justify-between items-start`}>
                <div>
                    <div className="flex gap-2 mb-3">
                        <span className="px-2.5 py-1 rounded-sm bg-on-surface text-background text-[10px] font-black uppercase tracking-widest">
                            TABLE {ticket.table_numero || '??'}
                        </span>
                        {isCritical && !isDone && <span className="px-2.5 py-1 rounded-sm bg-error text-on-error text-[10px] font-black uppercase tracking-widest animate-pulse">ALERTE RUSH</span>}
                    </div>
                    <h3 className="font-mono text-sm font-bold text-on-surface-variant opacity-60">ID-NEURAL: #{ticket.id}</h3>
                </div>
                
                <div className="text-right flex flex-col items-end">
                    <TicketTimer createdAt={ticket.created_at} onCritical={setIsCritical} />
                    <div className="flex items-center gap-1.5 mt-2 opacity-40">
                        <Timer className="w-3.5 h-3.5" />
                        <span className="font-sans text-[9px] font-bold uppercase tracking-widest">Temps réel</span>
                    </div>
                </div>
            </div>

            {/* Liste des Plats */}
            <div className="flex-1 p-3 bg-white flex flex-col gap-2">
                {ticket.lignes.map((item: any) => {
                    const isItemReady = item.statut === 'PRET';
                    return (
                        <button 
                            key={item.id}
                            onClick={() => onUpdateItem(item.id, item.statut)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-5 ${isItemReady ? 'bg-success/5 border-success/20 opacity-40' : 'bg-surface-container-lowest border-outline-variant hover:border-primary active:scale-[0.98]'}`}
                        >
                            <span className={`font-mono text-3xl font-black w-10 text-center ${isItemReady ? 'text-success' : 'text-primary'}`}>
                                {item.quantite}
                            </span>
                            <div className="flex-1">
                                <p className={`font-sans text-lg font-black uppercase tracking-tight ${isItemReady ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                                    {item.plat_nom}
                                </p>
                                {item.notes && (
                                    <p className="font-sans text-[10px] font-bold text-primary uppercase mt-1.5 tracking-wider bg-primary/5 inline-block px-2 py-1 rounded border border-primary/10">
                                        NOTE: {item.notes}
                                    </p>
                                )}
                            </div>
                            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${isItemReady ? 'bg-success border-success' : 'border-outline-variant group-hover:border-primary'}`}>
                                {isItemReady && <Check className="w-6 h-6 text-white" strokeWidth={4} />}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Bouton d'Action */}
            <div className="p-5 bg-surface-container-low border-t border-outline-variant">
                {isDone ? (
                    <button 
                        onClick={handleMainAction}
                        className="w-full h-16 rounded-xl border border-outline-variant bg-white text-on-surface-variant font-sans text-xs font-black uppercase tracking-widest hover:text-primary hover:border-primary transition-all"
                    >
                        Archiver le Ticket
                    </button>
                ) : (
                    <button 
                        onClick={handleMainAction}
                        className={`w-full h-16 rounded-xl font-sans text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 ${allLignesReady ? 'bg-success text-on-success hover:scale-[1.02]' : 'bg-primary text-on-primary hover:scale-[1.02]'}`}
                    >
                        {allLignesReady ? <><CheckCircle2 className="w-5 h-5" /> Envoyer au Service</> : <><Zap className="w-5 h-5" /> Forcer Prêt</>}
                    </button>
                )}
            </div>
        </div>
    );
};


// --- Page Principale KDS ---
export const KdsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tickets, setTickets, updateLigneStatut } = useKdsStore();
  const [isLoading, setIsLoading] = useState(true);
  
  const [clearedTickets, setClearedTickets] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('tastify_kds_cleared');
      if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed.map(Number);
      }
      return [];
    } catch {
      return [];
    }
  });

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
      console.error('Erreur KDS', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const syncer = setInterval(fetchTickets, 30000);
    return () => clearInterval(syncer);
  }, []);

  useEffect(() => {
    localStorage.setItem('tastify_kds_cleared', JSON.stringify(clearedTickets));
  }, [clearedTickets]);

  useEffect(() => {
    if (!isLoading && tickets.length > previousTicketsRef.current) {
        playDing();
    }
    previousTicketsRef.current = tickets.length;
  }, [tickets.length, isLoading]);

  const handleUpdateItem = async (ligneId: number, currentStatut: string) => {
    let nextStatut = '';
    if (currentStatut === 'EN_ATTENTE' || currentStatut === 'EN_PREPARATION') nextStatut = 'PRET';
    else if (currentStatut === 'PRET') nextStatut = 'EN_PREPARATION';
    else return;

    updateLigneStatut(ligneId, nextStatut);
    try {
      await kdsApi.updateItemStatut(ligneId, nextStatut);
    } catch (err) {
      updateLigneStatut(ligneId, currentStatut);
    }
  };

  const handleUpdateCommand = async (commandId: number, currentStatut: string, forceReady: boolean = false) => {
    if (currentStatut === 'EN_CUISINE') {
        if (forceReady) {
            const ticketToUpdate = tickets.find(t => t.id === commandId);
            if (ticketToUpdate) {
                for (const ligne of ticketToUpdate.lignes) {
                    if (ligne.statut !== 'PRET') {
                        updateLigneStatut(ligne.id, 'PRET');
                        await kdsApi.updateItemStatut(ligne.id, 'PRET').catch(() => {});
                    }
                }
            }
        }
        
        try {
            await kdsApi.updateCommandeStatut(commandId, 'PRETE');
            fetchTickets();
        } catch (err) {
            console.error('Erreur MAJ Commande', err);
        }
    } else if (currentStatut === 'PRETE') {
        setClearedTickets(prev => [...new Set([...prev, commandId])]);
    }
  };

  const columns = [
    { id: 'EN_CUISINE', label: 'En Préparation' },
    { id: 'PRETE', label: 'Prêt au Service' },
  ];

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary bg-background"><Loader2 className="w-16 h-16 animate-spin" /></div>;

  const visibleTickets = tickets.filter(t => !clearedTickets.includes(t.id));

  return (
    <div className="flex-1 flex flex-col bg-background font-sans selection:bg-primary/20 overflow-hidden">
      
      {/* KDS Header */}
      <header className="flex-none h-24 bg-white border-b border-outline-variant px-10 flex items-center justify-between z-20">
        <div className="flex items-center gap-8">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-xl bg-surface-container-low border border-outline-variant hover:text-primary transition-all flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-on-surface italic leading-none">Écran Cuisine <span className="sr-only">Kitchen Display System</span></h1>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.3em] mt-2 opacity-60">Système de Monitoring de Production</p>
          </div>
        </div>
        
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-10 bg-surface-container-low px-10 py-3 rounded-2xl border border-outline-variant">
             <div className="text-center border-r border-outline-variant pr-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Units Actives</p>
                <p className="text-2xl font-mono font-black text-on-surface leading-none mt-1">{visibleTickets.length}</p>
             </div>
             <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Status</p>
                <p className="text-[10px] font-black text-success uppercase leading-none mt-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> LIVE SYNC
                </p>
             </div>
          </div>
          
          <button 
            onClick={fetchTickets}
            className="h-14 px-8 rounded-xl bg-white border border-outline-variant font-black uppercase tracking-widest text-[11px] hover:text-primary hover:border-primary transition-all flex items-center gap-3 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" /> Actualiser
          </button>
        </div>
      </header>

      {/* Kanban Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-px bg-outline-variant overflow-hidden">
        {columns.map((col) => {
          const colTickets = visibleTickets.filter(t => t.statut === col.id);
          
          return (
            <section key={col.id} className="relative flex flex-col h-full bg-surface-container-lowest">
              <header className="flex-none h-16 bg-white border-b border-outline-variant px-8 flex items-center justify-between z-10">
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-on-surface-variant">{col.label}</h2>
                <div className="bg-primary/5 text-primary text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest border border-primary/10">
                  {colTickets.length} TICKETS
                </div>
              </header>

              <div className="absolute top-16 left-0 right-0 bottom-0 overflow-y-auto p-10 custom-scrollbar">
                {colTickets.length > 0 ? (
                  <div className="flex flex-col">
                    {colTickets.map((ticket) => (
                      <KdsTicket 
                        key={ticket.id} 
                        ticket={ticket} 
                        onUpdateItem={handleUpdateItem} 
                        onUpdateCommand={handleUpdateCommand} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 pb-20">
                    <PlayCircle className="w-24 h-24 mb-6 stroke-[1]" />
                    <p className="text-xl font-black uppercase tracking-[0.6em]">SECTEUR CLAIR</p>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
};
