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

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="max-w-[1700px] mx-auto animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface font-sans">Kitchen Command Center</h1>
          <p className="text-on-surface-variant mt-1.5 font-sans font-medium">Real-time order orchestration and preparation management.</p>
        </div>
        <div className="flex items-center gap-4 px-5 py-2.5 bg-surface-container-low rounded-xl border border-surface-container-high">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest font-sans">Live System</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="double-bezel flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-500 hover:scale-[1.01] transition-transform">
            {/* Ticket Header */}
            <div className={`p-6 flex items-center justify-between border-b border-surface-container-high ${ticket.type === 'EMPORTER' ? 'bg-secondary-container/30' : 'bg-primary-container/10'}`}>
              <div>
                <h3 className="font-bold text-xl text-on-surface tracking-tight font-sans">
                    {ticket.type === 'SUR_PLACE' ? `Table #${ticket.table_numero || '?'}` : `Takeaway: ${ticket.client_nom || 'Client'}`}
                </h3>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant font-bold uppercase tracking-wider mt-1 opacity-70">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-sans">{new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="glass px-4 py-2 rounded-xl text-xs font-bold text-on-surface uppercase tracking-widest border border-primary/10">
                #{ticket.id}
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 p-6 space-y-4 max-h-[450px] overflow-y-auto scrollbar-hide">
              {ticket.lignes.map((item) => (
                <div key={item.id} className="relative flex flex-col gap-3 p-5 bg-surface-container-low rounded-xl border border-surface-container-high transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-primary leading-none font-sans">x{item.quantite}</span>
                        <span className={`text-lg font-bold font-sans tracking-tight ${item.statut === 'PRET' ? 'text-on-surface-variant line-through opacity-50' : 'text-on-surface'}`}>
                          {item.plat_nom}
                        </span>
                      </div>
                      {item.notes && (
                        <div className="mt-2 text-xs font-bold text-secondary bg-secondary-container/50 px-3 py-1.5 rounded-lg italic font-sans flex items-center gap-2">
                          <span className="not-italic">“</span>
                          {item.notes}
                          <span className="not-italic">”</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <span className={`
                        px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest font-sans
                        ${item.statut === 'EN_ATTENTE' ? 'bg-surface-container-highest text-on-surface-variant' : 
                          item.statut === 'EN_PREPARATION' ? 'bg-primary-container/30 text-primary' : 
                          'bg-surface-container text-outline'}
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
                        w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold transition-all mt-2 font-sans text-sm tracking-tight
                        ${item.statut === 'EN_ATTENTE' ? 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high active:scale-95' : 'bg-primary text-white hover:shadow-lg hover:shadow-primary/20 active:scale-95'}
                      `}
                    >
                      {item.statut === 'EN_ATTENTE' ? (
                        <>
                          <PlayCircle className="w-5 h-5" />
                          <span>Démarrer</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Prêt</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Ticket Footer */}
            <div className="p-5 bg-surface-container-low/50 border-t border-surface-container-high flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest opacity-60 font-sans">
                    <Timer className="w-4 h-4" />
                    <span>Active for {getElapsedTime(ticket.created_at)}</span>
                </div>
                {ticket.lignes.every(l => l.statut === 'PRET') && (
                    <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest animate-pulse font-sans">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complet</span>
                    </div>
                )}
            </div>
          </div>
        ))}
        
        {tickets.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-on-surface-variant opacity-40 animate-in zoom-in duration-700">
            <div className="w-24 h-24 rounded-full bg-surface-container-high border-2 border-dashed border-outline-variant flex items-center justify-center mb-8">
                <ChefHat className="w-12 h-12" />
            </div>
            <p className="text-2xl font-display-accent italic">Kitchen is clear. No active orders.</p>
          </div>
        )}
      </div>
    </div>
  );
};
