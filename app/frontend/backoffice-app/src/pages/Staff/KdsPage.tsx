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
  UtensilsCrossed,
  Check
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
        <span className={`font-mono text-xl font-black tabular-nums tracking-tighter ${isRush ? 'text-[#ff4d4d]' : 'text-white'}`}>
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
    const isTakeaway = ticket.type === 'EMPORTER';
    const allLignesReady = ticket.lignes.every((l: any) => l.statut === 'PRET');
    const isDone = ticket.statut === 'PRETE';

    // Styles tactiques
    const borderColor = isDone ? 'border-[#00e676]' : (isCritical ? 'border-[#ff4d4d]' : 'border-[#4b4b4b]');
    const headerBg = isDone ? 'bg-[#00e676]/10' : (isCritical ? 'bg-[#ff4d4d]/10' : 'bg-[#1e1e1e]');

    const handleMainAction = () => {
        if (isDone) {
            // Retirer de l'écran
            onUpdateCommand(ticket.id, ticket.statut);
        } else if (allLignesReady) {
            // Passer la commande à "PRETE"
            onUpdateCommand(ticket.id, ticket.statut);
        } else {
            // Force tous les plats à PRET
            onUpdateCommand(ticket.id, ticket.statut, true);
        }
    };

    return (
        <div className={`flex flex-col bg-[#121212] border-2 ${borderColor} rounded-xl overflow-hidden shrink-0 shadow-2xl mb-4`}>
            
            {/* En-tête du Ticket */}
            <div className={`p-4 ${headerBg} border-b ${borderColor} flex justify-between items-start`}>
                <div>
                    <div className="flex gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-[11px] font-black uppercase tracking-widest ${isTakeaway ? 'bg-[#ff9100] text-black' : 'bg-white text-black'}`}>
                            {isTakeaway ? `À EMPORTER` : `TABLE ${ticket.table_numero || '??'}`}
                        </span>
                        {isCritical && !isDone && <span className="px-2 py-1 rounded bg-[#ff4d4d] text-white text-[11px] font-black uppercase tracking-widest animate-pulse">URGENT</span>}
                    </div>
                    <h3 className="font-mono text-lg font-bold text-white/70">#CMD-{ticket.id}</h3>
                    {isTakeaway && ticket.client_nom && <p className="font-sans text-sm font-bold text-white uppercase mt-1">{ticket.client_nom}</p>}
                </div>
                
                <div className="text-right flex flex-col items-end">
                    <TicketTimer createdAt={ticket.created_at} onCritical={setIsCritical} />
                    <div className="flex items-center gap-1.5 mt-2 opacity-50">
                        <Timer className="w-3.5 h-3.5" />
                        <span className="font-sans text-[10px] font-bold uppercase tracking-widest">Temps écoulé</span>
                    </div>
                </div>
            </div>

            {/* Liste des Plats */}
            <div className="flex-1 p-2 bg-[#121212] flex flex-col gap-2">
                {ticket.lignes.map((item: any) => {
                    const isItemReady = item.statut === 'PRET';
                    return (
                        <button 
                            key={item.id}
                            onClick={() => onUpdateItem(item.id, item.statut)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${isItemReady ? 'bg-[#00e676]/10 border-[#00e676]/30 opacity-50' : 'bg-[#1e1e1e] border-transparent hover:border-[#ffffff]/20 active:scale-95'}`}
                        >
                            <span className={`font-mono text-2xl font-black w-8 text-center ${isItemReady ? 'text-[#00e676]' : 'text-[#ff9100]'}`}>
                                {item.quantite}
                            </span>
                            <div className="flex-1">
                                <p className={`font-sans text-lg font-black uppercase tracking-tight ${isItemReady ? 'text-white/50 line-through' : 'text-white'}`}>
                                    {item.plat_nom}
                                </p>
                                {item.notes && (
                                    <p className="font-sans text-xs font-bold text-[#ff9100] uppercase mt-1 tracking-wider bg-[#ff9100]/10 inline-block px-2 py-1 rounded">
                                        NOTE: {item.notes}
                                    </p>
                                )}
                            </div>
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${isItemReady ? 'bg-[#00e676] border-[#00e676]' : 'border-[#4b4b4b]'}`}>
                                {isItemReady && <Check className="w-5 h-5 text-black" strokeWidth={3} />}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Bouton d'Action */}
            <div className="p-4 bg-[#1e1e1e] border-t border-[#333333]">
                {isDone ? (
                    <button 
                        onClick={handleMainAction}
                        className="w-full h-16 rounded-lg border-2 border-[#ffffff]/20 text-white font-sans text-sm font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                    >
                        Retirer de l'écran
                    </button>
                ) : (
                    <button 
                        onClick={handleMainAction}
                        className={`w-full h-16 rounded-lg font-sans text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${allLignesReady ? 'bg-[#00e676] text-black shadow-[0_0_20px_rgba(0,230,118,0.3)] hover:scale-[1.02] active:scale-[0.98]' : 'bg-[#ff9100] text-black hover:scale-[1.02] active:scale-[0.98]'}`}
                    >
                        {allLignesReady ? <><CheckCircle2 className="w-5 h-5" /> Envoyer au Passe</> : <><CheckCircle2 className="w-5 h-5" /> Tout marquer prêt</>}
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
  
  // Persistance robuste des tickets retirés
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
      console.error('Erreur chargement KDS', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const syncer = setInterval(fetchTickets, 30000); // Sync toutes les 30s
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
    else if (currentStatut === 'PRET') nextStatut = 'EN_PREPARATION'; // Rollback d'erreur
    else return;

    // UI Optimiste
    updateLigneStatut(ligneId, nextStatut);
    try {
      await kdsApi.updateItemStatut(ligneId, nextStatut);
    } catch (err) {
      updateLigneStatut(ligneId, currentStatut); // Annulation si erreur API
    }
  };

  const handleUpdateCommand = async (commandId: number, currentStatut: string, forceReady: boolean = false) => {
    if (currentStatut === 'EN_CUISINE') {
        if (forceReady) {
            // Option 1: Le cuisinier a cliqué sur "Tout marquer prêt"
            const ticketToUpdate = tickets.find(t => t.id === commandId);
            if (ticketToUpdate) {
                // Marquer chaque ligne comme prête localement puis sur l'API
                for (const ligne of ticketToUpdate.lignes) {
                    if (ligne.statut !== 'PRET') {
                        updateLigneStatut(ligne.id, 'PRET');
                        await kdsApi.updateItemStatut(ligne.id, 'PRET').catch(() => {});
                    }
                }
            }
        }
        
        // Ensuite, passer la commande elle-même à PRETE
        try {
            await kdsApi.updateCommandeStatut(commandId, 'PRETE');
            fetchTickets();
        } catch (err) {
            console.error('Erreur MAJ Commande', err);
        }
    } else if (currentStatut === 'PRETE') {
        // Le cuisinier retire le ticket de l'écran pour nettoyer sa vue
        setClearedTickets(prev => {
            const newSet = [...new Set([...prev, commandId])]; // Évite les doublons
            return newSet;
        });
    }
  };

  const columns = [
    { id: 'EN_CUISINE', label: 'En Préparation' },
    { id: 'PRETE', label: 'Prêt au Service' },
  ];

  if (isLoading) return <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center text-white"><Loader2 className="w-16 h-16 animate-spin" strokeWidth={2}/></div>;

  const visibleTickets = tickets.filter(t => !clearedTickets.includes(t.id));

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] text-white overflow-hidden font-sans -m-staff-margin">

      {/* Tactical Header */}
      <header className="flex-none h-20 bg-[#121212] border-b border-[#333333] px-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest leading-none text-[#ffffff]">Système KDS</h1>
            <p className="text-xs font-bold text-[#888888] uppercase tracking-[0.3em] mt-1">Cuisine Centrale</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-8 bg-[#1a1a1a] px-8 py-3 rounded-xl border border-[#333333]">
             <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#888888]">TICKETS ACTIFS</p>
                <p className="text-xl font-mono font-black text-[#ffffff] leading-none mt-1">{visibleTickets.length}</p>
             </div>
          </div>
          
          <button 
            onClick={fetchTickets}
            className="h-14 px-6 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#444444] font-black uppercase tracking-widest text-sm transition-colors flex items-center gap-3"
          >
            <RotateCcw className="w-5 h-5" /> Synchroniser
          </button>
        </div>
      </header>

      {/* Kanban Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-px bg-[#333333] overflow-hidden">
        {columns.map((col) => {
          const colTickets = visibleTickets.filter(t => t.statut === col.id);
          
          return (
            <section key={col.id} className="relative flex flex-col h-full bg-[#0a0a0a]">
              <header className="flex-none h-16 bg-[#121212] border-b border-[#333333] px-6 flex items-center justify-between shadow-md z-10">
                <h2 className="text-base font-black uppercase tracking-[0.3em] text-[#ffffff]">{col.label}</h2>
                <div className="bg-[#2a2a2a] text-white text-xs font-black px-3 py-1 rounded uppercase tracking-widest">
                  {colTickets.length} TICKETS
                </div>
              </header>

              {/* Scrollable Area (Robust CSS implementation) */}
              <div className="absolute top-16 left-0 right-0 bottom-0 overflow-y-auto p-6">
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
                  <div className="h-full flex flex-col items-center justify-center opacity-20 pb-20">
                    <UtensilsCrossed className="w-24 h-24 mb-6" strokeWidth={1} />
                    <p className="text-xl font-black uppercase tracking-[0.5em]">LIGNE CLAIRE</p>
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
