import React from 'react';
import { Commande } from '../types';
import { KdsTimer } from './KdsTimer';
import { Clock, User } from 'lucide-react';

interface TicketCardProps {
  order: Commande;
}

export const TicketCard: React.FC<TicketCardProps> = ({ order }) => {
  return (
    <div 
      data-testid={`ticket-card-${order.id}`}
      className="w-[320px] bg-[#264653] rounded-xl border border-white/10 flex flex-col h-full shadow-xl overflow-hidden animate-enter"
    >
      {/* Header */}
      <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold text-amber uppercase tracking-widest mb-1">Table</div>
          <div className="text-3xl font-black text-white leading-none">{order.table}</div>
        </div>
        <div className="text-right">
          <KdsTimer startTime={order.created_at} />
          <div className="text-[10px] text-foreground-muted mt-1 uppercase font-medium">#{order.id}</div>
        </div>
      </div>

      {/* Meta */}
      <div className="px-4 py-2 bg-black/10 flex items-center gap-3 text-[11px] text-foreground-muted">
        <div className="flex items-center gap-1">
          <Clock size={12} />
          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        {(order.serveur_username || order.serveur_name) && (
          <div className="flex items-center gap-1 truncate">
            <User size={12} />
            <span className="truncate">{order.serveur_username || order.serveur_name}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {order.lignes.map((ligne) => (
          <div key={ligne.id} className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal/20 border border-teal/30 flex items-center justify-center font-bold text-teal">
              {ligne.quantite}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white uppercase tracking-tight leading-tight">
                {ligne.plat_details.nom}
              </div>
              {ligne.notes && (
                <div className="mt-1 text-xs text-amber font-medium italic bg-amber/5 p-1.5 rounded-md border border-amber/10">
                  {ligne.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="p-3 bg-black/20 mt-auto">
        <button 
          className="w-full py-3 rounded-lg bg-teal text-white font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.98]"
          onClick={() => {
            // Logic for completing order will be in 14-04
            console.log('Complete order', order.id);
          }}
        >
          Terminer
        </button>
      </div>
    </div>
  );
};
