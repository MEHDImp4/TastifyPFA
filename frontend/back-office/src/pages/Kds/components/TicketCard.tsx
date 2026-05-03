import React, { useEffect, useState } from 'react';
import { Commande } from '../types';
import { KdsTimer } from './KdsTimer';
import { Clock3, CookingPot, NotebookPen, User } from 'lucide-react';

interface TicketCardProps {
  order: Commande;
  isNew?: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({ order, isNew = false }) => {
  const totalQuantity = order.lignes.reduce((sum, ligne) => sum + ligne.quantite, 0);
  const [showGlow, setShowGlow] = useState<boolean>(isNew);

  useEffect(() => {
    if (!isNew) {
      setShowGlow(false);
      return;
    }
    setShowGlow(true);
    const timer = window.setTimeout(() => setShowGlow(false), 10_000);
    return () => window.clearTimeout(timer);
  }, [isNew]);

  return (
    <article
      data-testid={`ticket-card-${order.id}`}
      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-2xl transition-all ${showGlow ? 'animate-new-ticket' : ''}`}
    >
      <div className="border-b border-white/5 bg-white/[0.02] px-4 py-3.5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber">Table</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-4xl font-bold leading-none tracking-tighter text-white">{order.table}</div>
              <div className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                #{order.id}
              </div>
            </div>
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
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          <span>{order.lignes.length} PLATS</span>
        </div>
        <span className="text-teal/80">{totalQuantity} PORTIONS</span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-2 py-3 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
        {order.lignes.map((ligne) => {
          const isPending = ligne.statut === 'EN_ATTENTE';
          const isPrep = ligne.statut === 'EN_PREPARATION';
          
          return (
            <div 
              key={ligne.id} 
              className={`group rounded-xl border p-2.5 transition-all ${
                isPrep 
                  ? 'border-teal/30 bg-teal/5 ring-1 ring-inset ring-teal/10 shadow-sm' 
                  : 'border-white/5 bg-white/[0.03] grayscale-[0.5] opacity-80'
              }`}
            >
              <div className="flex gap-3">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg font-bold transition-colors ${
                  isPrep 
                    ? 'bg-teal text-white' 
                    : 'bg-white/10 text-slate-400'
                }`}>
                  {ligne.quantite}
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`text-sm font-semibold leading-tight transition-colors ${
                      isPrep ? 'text-white' : 'text-slate-400'
                    }`}>
                      {ligne.plat_details.nom}
                    </div>
                    {ligne.heure_lancement && (
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

                  {ligne.notes && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber/10 bg-amber/5 px-2.5 py-2 text-[11px] leading-relaxed text-amber/90">
                      <NotebookPen size={12} className="mt-0.5 flex-shrink-0 opacity-70" />
                      <span>{ligne.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto border-t border-white/10 bg-surface-elevated/50 p-3">
        <button
          className="group relative w-full overflow-hidden rounded-xl bg-teal px-4 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-teal/20 transition-all active:scale-[0.98] hover:brightness-110"
          onClick={() => {
            console.log('Complete order', order.id);
          }}
        >
          <span className="relative z-10">Terminer le Ticket</span>
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
        </button>
      </div>
    </article>
  );
};
