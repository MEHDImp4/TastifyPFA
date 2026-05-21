import React, { useState, useEffect, useRef } from 'react';
import { kdsApi } from '../../api/kds';
import { useKdsStore } from '../../store/kdsStore';
import { Loader2, Clock, CheckCircle2, ChefHat, PlayCircle, Timer } from 'lucide-react';

const playDing = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // Up to A6

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
  }, []);

  useEffect(() => {
    // Play sound if new ticket arrived
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
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / 60000);
    return `${diff}m`;
  };

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-8 h-8 animate-spin"  strokeWidth={2.5}/></div>;

  return (
    <div className="max-w-[1700px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-display-lg text-[32px] text-on-surface leading-none">Kitchen Command Center</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-secondary"></div>
            <span className="text-ui-data-dense uppercase tracking-widest text-on-surface-variant font-bold">Real-time Order Orchestration</span>
          </div>
        </div>
        <div className="flex items-center gap-6 px-6 py-2 bg-surface-container border-2 border-on-surface shadow-[4px_4px_0px_#301400]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-on-surface bg-secondary animate-pulse" />
            <span className="text-ui-label-bold text-[10px] text-on-surface">Live Signal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-ui-data-dense font-black text-primary">{tickets.length} ACTIVE BATCHES</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="bg-surface-container border-2 border-on-surface flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-500 shadow-[6px_6px_0px_#301400] transition-all hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#301400]">
            {/* Ticket Header */}
            <div className={`p-5 flex items-center justify-between border-b-2 border-on-surface ${ticket.type === 'EMPORTER' ? 'bg-secondary-container' : 'bg-primary-container'}`}>
              <div>
                <h3 className="text-ui-label-bold text-[14px] text-on-secondary-container leading-none">
                    {ticket.type === 'SUR_PLACE' ? `TABLE #${ticket.table_numero || '?'}` : `CLIENT: ${ticket.client_nom || 'UNKNOWN'}`}
                </h3>
                <div className="flex items-center gap-2 text-ui-data-dense text-on-secondary-container/70 font-black mt-2">
                    <Clock className="w-3.5 h-3.5"  strokeWidth={2.5}/>
                    <span className="uppercase">{new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="bg-background border-2 border-on-surface px-3 py-1 text-ui-data-dense font-black text-on-surface">
                ID-{ticket.id}
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 p-4 space-y-4 max-h-[450px] overflow-y-auto scrollbar-hide">
              {ticket.lignes.map((item) => (
                <div key={item.id} className="relative flex flex-col gap-3 p-4 bg-background border-2 border-on-surface shadow-[4px_4px_0px_#301400/10] transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <span className="text-display-lg text-2xl text-primary leading-none">x{item.quantite}</span>
                        <span className={`text-ui-label-bold text-[13px] leading-tight ${item.statut === 'PRET' ? 'text-on-surface-variant line-through opacity-30' : 'text-on-surface'}`}>
                          {item.plat_nom.toUpperCase()}
                        </span>
                      </div>
                      {item.notes && (
                        <div className="mt-3 text-ui-data-dense text-secondary border-l-4 border-secondary pl-3 font-black py-1">
                          {item.notes.toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className={`
                        px-2 py-0.5 border-2 border-on-surface text-[9px] font-black uppercase tracking-widest
                        ${item.statut === 'EN_ATTENTE' ? 'bg-surface-container-highest text-on-surface' : 
                          item.statut === 'EN_PREPARATION' ? 'bg-primary text-on-primary' : 
                          'bg-background text-on-surface-variant opacity-40'}
                      `}>
                        {item.statut.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {item.statut !== 'PRET' && item.statut !== 'SERVI' && item.statut !== 'ANNULE' && (
                    <button 
                      onClick={() => handleUpdateItem(item.id, item.statut)}
                      className={`
                        w-full py-3 border-2 border-on-surface flex items-center justify-center gap-3 transition-all mt-2 text-ui-button font-ui-button shadow-[3px_3px_0px_#301400] active:translate-y-[2px] active:shadow-none
                        ${item.statut === 'EN_ATTENTE' ? 'bg-surface-container text-on-surface hover:bg-surface-container-highest' : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container'}
                      `}
                    >
                      {item.statut === 'EN_ATTENTE' ? (
                        <>
                          <PlayCircle className="w-4 h-4"  strokeWidth={2.5}/>
                          <span>ENGAGE</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4"  strokeWidth={2.5}/>
                          <span>COMPLETE</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Ticket Footer */}
            <div className="p-4 bg-surface-container-high border-t-2 border-on-surface flex items-center justify-between">
                <div className="flex items-center gap-2 text-ui-data-dense font-black text-on-surface-variant uppercase tracking-widest">
                    <Timer className="w-4 h-4"  strokeWidth={2.5}/>
                    <span>ACTIVE: {getElapsedTime(ticket.created_at)}</span>
                </div>
                {ticket.lignes.every(l => l.statut === 'PRET') && (
                    <div className="flex items-center gap-2 text-primary text-ui-label-bold text-[10px] animate-pulse">
                        <CheckCircle2 className="w-4 h-4"  strokeWidth={2.5}/>
                        <span>READY TO SERVE</span>
                    </div>
                )}
            </div>
          </div>
        ))}
        
        {tickets.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-on-surface-variant opacity-20">
            <div className="w-32 h-32 border-4 border-dashed border-on-surface flex items-center justify-center mb-8 rotate-3">
                <ChefHat className="w-12 h-12"  strokeWidth={2.5}/>
            </div>
            <p className="text-display-lg text-4xl italic uppercase tracking-tighter">Kitchen at Rest</p>
            <p className="text-ui-label-bold text-[11px] mt-4 tracking-[0.3em]">No active batches detected</p>
          </div>
        )}
      </div>
    </div>
  );
};
