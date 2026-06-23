import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  PlayCircle,
  Maximize,
  Minimize
} from 'lucide-react';

// --- Utilitaires ---
const playDing = async () => {
    try {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AC();
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }
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
        <span className={`font-mono text-lg sm:text-xl font-black tabular-nums tracking-tighter ${isRush ? 'text-error' : 'text-primary'}`}>
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
        <div data-testid={`kds-ticket-${ticket.id}`} className={`ops-card flex flex-col overflow-hidden shrink-0 mb-4 transition-all ${isCritical && !isDone ? 'ring-2 ring-error/20 border-error/30' : 'border-outline-variant'}`}>
            
            {/* En-tête du Ticket */}
            <div className={`p-3.5 ${statusBg} border-b border-outline-variant flex flex-row justify-between items-start gap-2`}>
                <div className="min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="px-1.5 py-0.5 rounded-sm bg-on-surface text-background text-[9px] font-black uppercase tracking-widest">
                            TABLE {ticket.table_numero || '??'}
                        </span>
                        {isCritical && !isDone && <span className="px-1.5 py-0.5 rounded-sm bg-error text-on-error text-[9px] font-black tracking-widest">Retard</span>}
                        {isDone && <span className="px-1.5 py-0.5 rounded-sm bg-success text-on-success text-[9px] font-black uppercase tracking-widest">TERMINÉ</span>}
                        {!isDone && allLignesReady && <span className="px-1.5 py-0.5 rounded-sm bg-success text-on-success text-[9px] font-black uppercase tracking-widest">PRÊT</span>}
                    </div>
                    <h3 className="font-mono text-xs font-bold text-on-surface">Commande #{ticket.id}</h3>
                </div>
                
                <div className="text-right flex flex-col items-end">
                    <TicketTimer createdAt={ticket.created_at} onCritical={setIsCritical} />
                    <div className="flex items-center gap-1 mt-1 opacity-80">
                        <Timer className="w-3 h-3" />
                        <span className="font-sans text-[8px] font-bold uppercase tracking-widest text-on-surface">Temps réel</span>
                    </div>
                </div>
            </div>

            {/* Liste des Plats */}
            <div className="flex-1 p-2 bg-surface-container-low flex flex-col gap-2">
                {ticket.lignes.map((item: any) => {
                    const isItemReady = item.statut === 'PRET';
                    return (
                        <button 
                            key={item.id}
                            onClick={() => onUpdateItem(item.id, item.statut)}
                            className={`w-full min-h-12 text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3 sm:gap-4 ${isItemReady ? 'bg-success/5 border-success/20 opacity-75' : 'bg-surface-container-lowest border-outline-variant hover:border-primary active:scale-[0.98]'}`}
                        >
                            <span className={`font-mono text-xl font-black w-8 text-center ${isItemReady ? 'text-success' : 'text-primary'}`}>
                                {item.quantite}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className={`font-sans text-xs sm:text-sm font-black uppercase tracking-tight leading-tight ${isItemReady ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                                    {item.plat_nom}
                                </p>
                                <div className="flex flex-wrap gap-1.5 items-center mt-1">
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-primary text-on-primary uppercase">
                                        {item.statut === 'PRET' ? 'PRÊT' : (item.statut === 'EN_PREPARATION' ? 'En préparation' : 'En attente')}
                                    </span>
                                    {item.notes && (
                                        <p className="font-sans text-[8px] font-black text-primary bg-primary/10 uppercase tracking-wider inline-block px-1.5 py-0.5 rounded border border-primary/20">
                                            NOTE: {item.notes}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${isItemReady ? 'bg-success border-success' : 'border-outline group-hover:border-primary'}`}>
                                {isItemReady && <Check className="w-4 h-4 text-on-success" strokeWidth={4} />}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Bouton d'Action */}
            <div className="p-3.5 bg-surface-container-low border-t border-outline-variant">
                {isDone ? (
                    <button 
                        onClick={handleMainAction}
                        className="btn-secondary w-full min-h-11 rounded-lg text-xs"
                    >
                        Archiver le Ticket
                    </button>
                ) : (
                    <button 
                        onClick={handleMainAction}
                        className={`w-full min-h-11 rounded-lg font-sans text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${allLignesReady ? 'bg-success text-on-success hover:scale-[1.01]' : 'bg-primary text-on-primary hover:scale-[1.01]'}`}
                    >
                        {allLignesReady ? <><CheckCircle2 className="w-4 h-4" /> Envoyer au service</> : <><Zap className="w-4 h-4" /> Marquer prêt</>}
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
  const [isFocusMode, setIsFocusMode] = useState(false);
  
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

  const fetchTickets = useCallback(async () => {
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
  }, [setTickets]);

  useEffect(() => {
    fetchTickets();
    const syncer = setInterval(fetchTickets, 30000);
    return () => clearInterval(syncer);
  }, [fetchTickets]);

  useEffect(() => {
    localStorage.setItem('tastify_kds_cleared', JSON.stringify(clearedTickets));
  }, [clearedTickets]);

  useEffect(() => {
    if (!isLoading && tickets.length > previousTicketsRef.current) {
        playDing();
    }
    previousTicketsRef.current = tickets.length;
  }, [tickets.length, isLoading]);

  useEffect(() => {
    if (!isFocusMode) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFocusMode]);

  const handleUpdateItem = async (ligneId: number, currentStatut: string) => {
    let nextStatut = '';
    if (currentStatut === 'EN_ATTENTE') nextStatut = 'EN_PREPARATION';
    else if (currentStatut === 'EN_PREPARATION') nextStatut = 'PRET';
    else if (currentStatut === 'PRET') nextStatut = 'EN_ATTENTE';
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

  const handleFocusModeToggle = () => {
    setIsFocusMode((current) => !current);
  };

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary bg-background"><Loader2 className="w-16 h-16 animate-spin" /></div>;

  const visibleTickets = tickets.filter(t => !clearedTickets.includes(t.id));

  return (
    <div
      className={`flex-1 flex flex-col bg-background font-sans selection:bg-primary/20 overflow-y-auto lg:overflow-hidden ${isFocusMode ? 'min-h-0' : ''}`}
    >
      
      {/* KDS Header */}
      <header className="flex-none min-h-16 bg-surface-container-high border-b border-outline-variant px-4 py-3 md:px-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between z-20">
        <div className="flex w-full min-w-0 items-center gap-4 lg:w-auto lg:gap-8">
          <button
            onClick={() => navigate(-1)}
            aria-label="Retour au tableau de bord"
            className="btn-icon rounded-xl bg-surface-container-low"
          >
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>
        
        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center lg:w-auto lg:gap-6">
          <div className="flex min-h-11 items-center justify-between gap-3 bg-surface-container-low px-4 py-1.5 rounded-lg border border-outline-variant sm:px-5 lg:px-6">
             <div className="text-left border-r border-outline-variant pr-3 sm:text-center sm:pr-6 lg:pr-8">
               <p className="text-[9px] font-black uppercase tracking-widest text-on-surface">Unités Actives</p>
               <p className="text-xl font-mono font-black text-on-surface leading-none mt-0.5">{visibleTickets.length}</p>
             </div>
             <div className="text-left sm:text-center">
               <p className="text-[9px] font-black uppercase tracking-widest text-on-surface">Statut</p>
               <p className="text-[9px] font-black text-success uppercase leading-none mt-1 flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> En direct
               </p>
             </div>
          </div>

          <button 
            onClick={fetchTickets}
            className="btn-secondary min-h-11 px-6 rounded-lg text-[11px] active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Actualiser
          </button>

          <button
            type="button"
            onClick={handleFocusModeToggle}
            aria-pressed={isFocusMode}
            aria-label={isFocusMode ? 'Quitter le mode focus du KDS' : 'Activer le mode focus du KDS'}
            data-testid="kds-fullscreen-toggle"
            className="btn-secondary min-h-11 px-6 rounded-lg text-[11px] active:scale-95"
          >
            {isFocusMode ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            {isFocusMode ? 'Quitter le mode focus' : 'Mode focus'}
          </button>
        </div>
      </header>

      {/* Kanban Grid */}
      <main className="flex-none lg:flex-1 grid grid-cols-1 lg:grid-cols-2 gap-px bg-outline-variant overflow-visible lg:overflow-hidden">
        {columns.map((col) => {
          const colTickets = visibleTickets.filter(t => t.statut === col.id);

          return (
            <section key={col.id} className="relative flex flex-col min-h-[28rem] lg:min-h-0 lg:h-full bg-surface-container-lowest">
              <header className="flex-none min-h-12 bg-surface-container-high border-b border-outline-variant px-4 py-2 md:px-6 flex items-center justify-between gap-3 z-10">
                <h2 className="text-[11px] font-black uppercase tracking-[0.15em] sm:tracking-[0.3em] text-on-surface">{col.label}</h2>
                <div className="bg-primary text-on-primary text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest border border-primary">
                  {colTickets.length} TICKETS
                </div>
              </header>

              <div tabIndex={0} className="absolute top-12 left-0 right-0 bottom-0 overflow-y-auto p-3 md:p-5 custom-scrollbar">
                {colTickets.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 min-[1700px]:grid-cols-3 gap-4">
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
                  <div className="h-full flex flex-col items-center justify-center px-6 pb-20 text-center">
                    <PlayCircle aria-hidden="true" className="w-16 h-16 md:w-20 md:h-20 mb-4 stroke-[2] text-primary" />
                    <p aria-hidden="true" className="text-sm md:text-base font-black uppercase tracking-[0.15em] md:tracking-[0.4em] text-on-surface">Aucune commande en attente</p>
                    <span aria-hidden="true" className="text-[10px] font-black tracking-widest text-on-surface mt-1.5">Colonne vide</span>
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
