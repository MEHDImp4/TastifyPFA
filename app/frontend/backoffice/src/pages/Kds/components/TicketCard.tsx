import React, { useEffect, useState } from 'react';
import { Commande } from '../types';
import { KdsTimer } from './KdsTimer';
import { Ban, Check, Clock3, CookingPot, Loader2, NotebookPen, User } from 'lucide-react';
import { useKdsStore } from '../store/useKdsStore';

interface TicketCardProps {
  order: Commande;
  isNew?: boolean;
}

const formatServiceTime = (value: string) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';
};

export const TicketCard: React.FC<TicketCardProps> = ({ order, isNew = false }) => {
  const updateLineStatus = useKdsStore((state) => state.updateLineStatus);
  const completeOrder = useKdsStore((state) => state.completeOrder);
  const updatePlatAvailability = useKdsStore((state) => state.updatePlatAvailability);
  const lignes = Array.isArray(order.lignes) ? order.lignes : [];
  const totalQuantity = lignes.reduce((sum, ligne) => sum + ligne.quantite, 0);
  const [showGlow, setShowGlow] = useState<boolean>(isNew);
  const [isCompleting, setIsCompleting] = useState(false);
  const [updatingLineId, setUpdatingLineId] = useState<number | null>(null);
  const [updatingPlatId, setUpdatingPlatId] = useState<number | null>(null);

  useEffect(() => {
    if (!isNew) {
      setShowGlow(false);
      return;
    }
    setShowGlow(true);
    const timer = window.setTimeout(() => setShowGlow(false), 10_000);
    return () => window.clearTimeout(timer);
  }, [isNew]);

  const handleLineReady = async (lineId: number) => {
    setUpdatingLineId(lineId);
    await updateLineStatus(lineId, 'PRET');
    setUpdatingLineId(null);
  };

  const handleMarkRupture = async (platId: number) => {
    if (!window.confirm("Signaler cette plat en rupture immédiate ?")) return;
    setUpdatingPlatId(platId);
    await updatePlatAvailability(platId, false);
    setUpdatingPlatId(null);
  };

  const handleCompleteOrder = async () => {
    setIsCompleting(true);
    await completeOrder(order.id);
    setIsCompleting(false);
  };

  return (
    <article
      data-testid={`ticket-card-${order.id}`}
      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-2xl transition-all ${showGlow ? 'animate-new-ticket' : ''}`}
    >
      <div className="border-b border-white/5 bg-white/[0.02] px-4 py-3.5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber">
              {order.type === 'EMPORTER' ? 'Client' : 'Table'}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-4xl font-bold leading-none tracking-tighter text-white">
                {order.type === 'EMPORTER' ? (order.client_nom || '—') : order.table}
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                #{order.id}
              </div>
            </div>
            {order.type === 'EMPORTER' && (
              <div className="mt-2 inline-flex items-center rounded-full bg-amber/10 border border-amber/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber animate-pulse">
                A Emporter
              </div>
            )}
          </div>
          <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-right ring-1 ring-inset ring-white/5">
            <KdsTimer startTime={order.created_at} />
            <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Temps écoulé</div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex flex-col gap-1 rounded-lg border border-white/5 bg-black/10 px-2.5 py-2">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Clock3 size={12} className="text-teal/70" />
              <span>Service</span>
            </div>
            <div className="font-semibold text-white">
              {formatServiceTime(order.created_at)}
            </div>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-white/5 bg-black/10 px-2.5 py-2">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <User size={12} className="text-teal/70" />
              <span>Serveur</span>
            </div>
            <div className="truncate font-semibold text-white">
              {order.serveur_username || order.serveur_name || '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-white/5 bg-black/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <div className="flex items-center gap-1.5">
          <CookingPot size={13} className="text-teal" />
          <span>{lignes.length} PLATS</span>
        </div>
        <span className="text-teal/80">{totalQuantity} PORTIONS</span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-2 py-3 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
        {lignes.map((ligne) => {
          const isPending = ligne.statut === 'EN_ATTENTE';
          const isPrep = ligne.statut === 'EN_PREPARATION';
          const isPret = ligne.statut === 'PRET';
          const isUpdating = updatingLineId === ligne.id;
          
          return (
            <div 
              key={ligne.id} 
              className={`group relative rounded-xl border p-2.5 transition-all ${
                isPret
                  ? 'border-green-500/20 bg-green-500/5 grayscale opacity-60'
                  : isPrep 
                    ? 'border-teal/30 bg-teal/5 ring-1 ring-inset ring-teal/10 shadow-sm' 
                    : 'border-white/5 bg-white/[0.03] grayscale-[0.5] opacity-80'
              }`}
            >
              <div className="flex gap-3">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg font-bold transition-colors ${
                  isPret
                    ? 'bg-green-500 text-white'
                    : isPrep 
                      ? 'bg-teal text-white' 
                      : 'bg-white/10 text-slate-400'
                }`}>
                  {ligne.quantite}
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`text-sm font-semibold leading-tight transition-colors ${
                      isPret ? 'text-slate-400 line-through' : isPrep ? 'text-white' : 'text-slate-400'
                    }`}>
                      {ligne.plat_details?.nom ?? `Plat #${ligne.plat}`}
                    </div>
                    {ligne.heure_lancement && !isPret && (
                      <div className="flex-shrink-0 scale-75 origin-right translate-y-[-2px]">
                        <KdsTimer startTime={ligne.heure_lancement} />
                      </div>
                    )}
                  </div>
                  
                  {isPending && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-slate-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Programmé</span>
                    </div>
                  )}

                  {isPret && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <Check size={10} className="text-green-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-green-500">Prêt</span>
                    </div>
                  )}

                  {ligne.notes && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber/10 bg-amber/5 px-2.5 py-2 text-[11px] leading-relaxed text-amber/90">
                      <NotebookPen size={12} className="mt-0.5 flex-shrink-0 opacity-70" />
                      <span>{ligne.notes}</span>
                    </div>
                  )}
                </div>

                {!isPret && (
                  <div className="flex flex-col gap-1">
                    <button
                      disabled={isUpdating}
                      onClick={() => handleLineReady(ligne.id)}
                      title="Marquer comme prêt"
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-green-500 hover:text-white hover:border-green-500 active:scale-90 disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} />}
                    </button>
                    
                    <button
                      disabled={updatingPlatId === ligne.plat}
                      onClick={() => handleMarkRupture(ligne.plat)}
                      title="Signaler rupture"
                      className="flex h-7 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-500/40 transition-all hover:bg-red-500 hover:text-white hover:border-red-500 active:scale-90 disabled:opacity-50"
                    >
                      {updatingPlatId === ligne.plat ? <Loader2 size={10} className="animate-spin" /> : <Ban size={14} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto border-t border-white/10 bg-surface-elevated/50 p-3">
        <button
          disabled={isCompleting || order.statut === 'PRETE'}
          className="group relative w-full overflow-hidden rounded-xl bg-teal px-4 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-teal/20 transition-all active:scale-[0.98] hover:brightness-110 disabled:opacity-50 disabled:grayscale"
          onClick={handleCompleteOrder}
        >
          <span className="relative z-10">
            {isCompleting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : order.statut === 'PRETE' ? 'Ticket Prêt' : 'Terminer le Ticket'}
          </span>
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
        </button>
      </div>
    </article>
  );
};
