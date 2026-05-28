import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { kdsApi } from '../../api/kds';
import { useKdsStore } from '../../store/kdsStore';
import { 
  Loader2, 
  ArrowLeft,
  Filter,
  PlayCircle,
  Timer,
  CheckCircle2,
  Play,
  RotateCcw
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
  const navigate = useNavigate();
  const { tickets, setTickets, updateLigneStatut } = useKdsStore();
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clearedTickets, setClearedTickets] = useState<number[]>([]);
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

  const handleUpdateCommand = async (commandId: number, currentStatut: string) => {
    if (currentStatut === 'EN_CUISINE') {
      try {
        await kdsApi.updateCommandeStatut(commandId, 'PRETE');
        fetchTickets();
      } catch (err) {
        console.error('Failed to update command statut', err);
      }
    } else if (currentStatut === 'PRETE') {
      // Pour éviter l'erreur 403, le cuisinier retire simplement le ticket de son écran localement
      setClearedTickets(prev => [...prev, commandId]);
    }
  };

  const getElapsedTime = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = currentTime.getTime();
    const totalSeconds = Math.floor((now - start) / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const isTicketCritical = (createdAt: string) => {
    const start = new Date(createdAt).getTime();
    const now = currentTime.getTime();
    return (now - start) > 15 * 60000;
  };

  const columns = [
    { id: 'EN_CUISINE', label: 'En Préparation', icon: Timer, color: 'text-primary' },
    { id: 'PRETE', label: 'Prêt au Service', icon: CheckCircle2, color: 'text-success' },
  ];

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/></div>;

  const visibleTickets = tickets.filter(t => !clearedTickets.includes(t.id));

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden -m-staff-margin p-0 selection:bg-primary/20 selection:text-primary font-body">
      
      {/* Tactical KDS Header */}
      <header className="flex-none flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-staff-margin py-unit-md">
        <div className="flex items-center gap-unit-md">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Retour à l'écran précédent"
            title="Retour à l'écran précédent"
            className="flex items-center justify-center size-10 rounded-md border border-outline-variant text-on-surface hover:bg-surface-variant transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="sr-only">Retour</span>
          </button>
          <div>
            <h1 className="font-serif text-2xl font-bold text-on-surface leading-none">Écran Cuisine (KDS)</h1>
            <h2 className="sr-only">Cuisine</h2>
            <p className="font-sans text-[11px] font-bold text-on-surface-variant mt-unit-xs uppercase tracking-wider">Service du Soir • {currentTime.toLocaleTimeString('fr-FR', { hour12: false })}</p>
          </div>
        </div>
        <div className="flex items-center gap-staff-gutter">
          <div className="flex gap-unit-md border-r border-outline-variant pr-unit-md mr-unit-md">
            <div className="text-center">
              <p className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Temps Moyen</p>
              <p className="font-sans text-[15px] font-bold text-primary mt-1">12m 45s</p>
            </div>
            <div className="text-center">
              <p className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Actifs</p>
              <p className="font-sans text-[15px] font-bold text-on-surface mt-1">{visibleTickets.length}</p>
            </div>
          </div>
          <button className="flex items-center gap-unit-xs h-10 px-unit-md rounded-md bg-surface-variant border border-outline-variant text-on-surface hover:border-outline transition-colors font-sans text-xs font-bold uppercase tracking-wider">
            <Filter className="w-4 h-4" />
            Poste : Grill & Expo
          </button>
        </div>
      </header>

      {/* Kanban Grid */}
      <main className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0 bg-surface-container-lowest">
        {columns.map((col) => (
          <section key={col.id} className="flex flex-col h-full border-r border-outline-variant last:border-r-0">
            <header className="flex-none flex items-center justify-between p-unit-md border-b border-outline-variant bg-surface-container">
              <div className="flex items-center gap-3">
                <col.icon className={`w-4 h-4 ${col.color}`} />
                <h2 className={`font-sans text-[12px] font-black uppercase tracking-[0.2em] ${col.color}`}>{col.label}</h2>
              </div>
              <span className="flex items-center justify-center bg-surface-container-highest text-on-surface font-sans text-[11px] font-bold rounded-full h-6 w-6 border border-outline-variant">
                {visibleTickets.filter(t => t.statut === col.id).length}
              </span>
            </header>

            <div className="flex-1 overflow-y-auto p-unit-md flex flex-col gap-unit-md custom-scrollbar bg-background/50 relative">
              <AnimatePresence>
                {visibleTickets.filter(t => t.statut === col.id).map((ticket) => {
                  const critical = isTicketCritical(ticket.created_at) && ticket.statut !== 'PRET';
                  const isTakeaway = ticket.type === 'EMPORTER';
                  const allLignesReady = ticket.lignes.every(l => l.statut === 'PRET');
                  
                  return (
                    <motion.article 
                      key={ticket.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      data-testid={`kds-ticket-${ticket.id}`}
                      className={`
                        flex flex-col rounded-lg border overflow-hidden shadow-sm transition-all duration-300
                        ${critical ? 'border-error ring-1 ring-error/20 bg-error/5' : 'border-outline-variant bg-surface-container-low'}
                      `}
                    >
                      <div className={`flex items-start justify-between p-unit-md border-b ${critical ? 'border-error/30 bg-error/10' : 'border-outline-variant bg-surface-container-high'}`}>
                        <div>
                          <div className="flex items-center gap-unit-xs mb-1">
                            <span className="px-2 py-0.5 rounded-sm bg-surface-bright border border-outline-variant text-on-surface font-sans text-[10px] font-bold uppercase tracking-wider">
                              {isTakeaway ? `À EMPORTER : ${ticket.client_nom || 'INVITÉ'}` : `Table ${ticket.table_numero || '??'}`}
                            </span>
                            {critical && <span className="px-2 py-0.5 rounded-sm bg-error text-on-error font-sans text-[10px] font-black uppercase tracking-wider animate-pulse">URGENT</span>}
                            {allLignesReady && <span className="px-2 py-0.5 rounded-sm bg-success text-on-success font-sans text-[10px] font-black uppercase tracking-wider">PRÊT</span>}
                          </div>
                          <h3 className={`font-serif text-lg font-bold leading-none mt-1 ${critical ? 'text-error' : 'text-on-surface'}`}>#{ticket.id}</h3>
                        </div>
                        <div className="text-right">
                          <span className={`font-sans text-[11px] font-bold px-2 py-1 rounded border flex items-center gap-1.5 ${critical ? 'text-error border-error/30 bg-error/20' : 'text-on-surface-variant border-outline-variant bg-surface'}`}>
                            <Timer className="w-3 h-3" />
                            {getElapsedTime(ticket.created_at)}
                          </span>
                        </div>
                      </div>

                      <ul className="flex-1 flex flex-col p-unit-md gap-unit-sm bg-surface-container-lowest/40">
                        {ticket.lignes.map((item) => (
                          <li key={item.id} 
                              className={`flex items-start gap-unit-md py-2 border-b border-outline-variant/10 last:border-b-0 cursor-pointer group`}
                              onClick={() => handleUpdateItem(item.id, item.statut)}
                          >
                            <span className={`font-sans text-primary text-base font-bold w-6 ${item.statut === 'PRET' ? 'opacity-30' : ''}`}>{item.quantite}x</span>
                            <div className="flex-1">
                              <p className={`font-body text-[15px] font-bold leading-tight ${item.statut === 'PRET' ? 'text-on-surface-variant/40 line-through' : 'text-on-surface'}`}>
                                {item.plat_nom}
                              </p>
                              {item.notes && (
                                <p className="font-sans text-[10px] font-black text-primary uppercase mt-1 tracking-widest leading-none">• {item.notes}</p>
                              )}
                            </div>
                            <div className={`size-6 rounded border-2 flex items-center justify-center transition-all ${item.statut === 'PRET' ? 'bg-primary border-primary' : 'border-outline/30 group-hover:border-primary'}`}>
                              {item.statut === 'PRET' ? <CheckCircle2 data-testid="ready-icon" className="w-4 h-4 text-on-primary" /> : (item.statut === 'EN_PREPARATION' ? <RotateCcw className="w-3 h-3 text-primary animate-spin-slow" /> : <Play className="w-3 h-3 text-on-surface-variant/30" />)}
                            </div>
                          </li>
                        ))}
                      </ul>

                      <div className={`p-unit-sm border-t ${critical ? 'border-error/30 bg-error/5' : 'border-outline-variant bg-surface-container-high'}`}>
                        {ticket.statut === 'PRETE' ? (
                          <button 
                            onClick={() => handleUpdateCommand(ticket.id, ticket.statut)}
                            className="w-full h-12 rounded-md bg-transparent border-2 border-primary/40 text-primary hover:bg-primary hover:text-on-primary font-sans text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                          >
                             Retirer de l'écran
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleUpdateCommand(ticket.id, ticket.statut)}
                            disabled={!allLignesReady}
                            className={`w-full h-12 rounded-md font-sans text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${critical ? 'bg-error text-on-error hover:bg-error/90' : (allLignesReady ? 'bg-primary text-on-primary hover:bg-primary/90 shadow-lg shadow-primary/20' : 'bg-surface-container-highest text-on-surface-variant/20 cursor-not-allowed')}`}
                          >
                            {allLignesReady ? <><CheckCircle2 className="w-4 h-4" /> Prêt à servir</> : <><Loader2 className="w-4 h-4 animate-spin" /> En cours...</>}
                          </button>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>

              {visibleTickets.filter(t => t.statut === col.id).length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center py-20">
                  <PlayCircle className="w-16 h-16 stroke-[1] text-on-surface-variant/40" />
                  <p className="font-sans text-[10px] font-black uppercase tracking-[0.5em] mt-4 text-on-surface-variant">Aucune commande</p>
                  <span className="sr-only">Cuisine vide.</span>
                </div>
              )}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};


