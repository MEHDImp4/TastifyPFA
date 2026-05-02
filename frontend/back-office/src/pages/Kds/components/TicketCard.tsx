import React from 'react';
import { Commande } from '../types';
import { KdsTimer } from './KdsTimer';
import { Clock3, CookingPot, NotebookPen, User } from 'lucide-react';

interface TicketCardProps {
  order: Commande;
}

export const TicketCard: React.FC<TicketCardProps> = ({ order }) => {
  const totalQuantity = order.lignes.reduce((sum, ligne) => sum + ligne.quantite, 0);

  return (
    <article
      data-testid={`ticket-card-${order.id}`}
      className="flex h-full flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#264653]/92 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-sm"
    >
      <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber">Table</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-3xl font-semibold leading-none text-white">{order.table}</div>
              <div className="rounded-full border border-white/10 bg-black/15 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                #{order.id}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2 text-right">
            <KdsTimer startTime={order.created_at} />
            <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Ecoule</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock3 size={12} />
              Service
            </div>
            <div className="mt-1 font-medium text-white">
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2">
            <div className="flex items-center gap-1.5 text-slate-400">
              <User size={12} />
              Serveur
            </div>
            <div className="mt-1 truncate font-medium text-white">
              {order.serveur_username || order.serveur_name || 'Non assigne'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-slate-400">
        <div className="flex items-center gap-1.5">
          <CookingPot size={12} />
          {order.lignes.length} plats
        </div>
        <div>{totalQuantity} portions</div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3 custom-scrollbar">
        {order.lignes.map((ligne) => (
          <div key={ligne.id} className="rounded-2xl border border-white/8 bg-black/10 px-3 py-2.5">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-teal/25 bg-teal/15 text-sm font-semibold text-teal">
              {ligne.quantite}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold leading-tight text-white">
                  {ligne.plat_details.nom}
                </div>
                {ligne.notes && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber/15 bg-amber/8 px-2.5 py-2 text-[11px] leading-4 text-amber">
                    <NotebookPen size={12} className="mt-0.5 flex-shrink-0" />
                    <span>{ligne.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-white/10 bg-black/15 px-3 py-3">
        <div className="mb-2 flex items-center justify-between px-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
          <span>Priorite cuisine</span>
          <span>{totalQuantity > 3 ? 'Chargee' : 'Normale'}</span>
        </div>
        <button
          className="w-full rounded-2xl bg-teal px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-transform transition-[filter] duration-150 ease-out active:scale-[0.97] hover:brightness-110"
          onClick={() => {
            console.log('Complete order', order.id);
          }}
        >
          Terminer
        </button>
      </div>
    </article>
  );
};
