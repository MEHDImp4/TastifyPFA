import React, { useEffect, useRef } from 'react';
import { ChefHat, Clock3, Loader2, ReceiptText } from 'lucide-react';
import { useKdsStore } from './store/useKdsStore';
import { KdsSocketManager } from './KdsSocketManager';
import { TicketCard } from './components/TicketCard';

export const KdsPage: React.FC = () => {
  const { orders, isLoading, error, fetchOrders } = useKdsStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) {
      return;
    }

    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const totalItems = orders.reduce((sum, order) => sum + order.lignes.length, 0);
  const urgentOrders = orders.filter((order) => {
    const minutes = (Date.now() - new Date(order.created_at).getTime()) / 60000;
    return minutes >= 10;
  }).length;

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-[#1a323b]">
        <Loader2 data-testid="loader" className="w-8 h-8 text-teal animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(42,157,143,0.18),_transparent_24%),linear-gradient(180deg,_#1d3740_0%,_#162930_100%)]">
      <KdsSocketManager />

      {error && (
        <div className="bg-red/10 border-b border-red/20 p-4 text-red text-center text-sm">
          {error}
        </div>
      )}

      <div className="border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal/80">Kitchen display</p>
            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">Flux cuisine</h1>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-200">
                {orders.length} tickets
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 xl:w-[28rem]">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                <ChefHat size={12} />
                Actifs
              </div>
              <div className="mt-1 text-xl font-semibold text-white">{orders.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                <ReceiptText size={12} />
                Lignes
              </div>
              <div className="mt-1 text-xl font-semibold text-white">{totalItems}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                <Clock3 size={12} />
                Urgent
              </div>
              <div className="mt-1 text-xl font-semibold text-amber">{urgentOrders}</div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onWheel={handleWheel}
        data-testid="kds-scroll-rail"
        className="flex flex-1 gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain overscroll-y-none px-4 py-4 select-none [scrollbar-gutter:stable] sm:gap-4 sm:px-5 touch-pan-x"
      >
        {orders.map((order) => (
          <div key={order.id} className="h-full w-[min(18rem,calc(100vw-2.5rem))] flex-shrink-0 xl:w-[17.5rem] 2xl:w-[18.5rem]">
            <TicketCard order={order} />
          </div>
        ))}

        {orders.length === 0 && !isLoading && (
          <div className="flex flex-1 flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-black/10 text-foreground-muted opacity-80">
            <p className="text-xl font-medium text-white">Cuisine Vide</p>
            <p className="mt-1 text-sm text-slate-400">En attente de nouvelles commandes...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KdsPage;
