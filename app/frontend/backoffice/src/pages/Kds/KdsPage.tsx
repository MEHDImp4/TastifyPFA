import React, { useEffect, useRef } from 'react';
import { ChefHat, Clock3, Loader2, ReceiptText } from 'lucide-react';
import { useKdsStore } from './store/useKdsStore';
import { KdsSocketManager } from './KdsSocketManager';
import { TicketCard } from './components/TicketCard';

const getFiniteTimestamp = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

export const KdsPage: React.FC = () => {
  const orders = useKdsStore((state) => state.orders);
  const isLoading = useKdsStore((state) => state.isLoading);
  const error = useKdsStore((state) => state.error);
  const fetchOrders = useKdsStore((state) => state.fetchOrders);
  const newOrderIds = useKdsStore((state) => state.newOrderIds);
  const clearNewOrder = useKdsStore((state) => state.clearNewOrder);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (newOrderIds.size === 0) return;
    const timers: number[] = [];
    newOrderIds.forEach((id) => {
      const t = window.setTimeout(() => clearNewOrder(id), 10_000);
      timers.push(t);
    });
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [newOrderIds, clearNewOrder]);

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
    const createdAt = getFiniteTimestamp(order.created_at);
    if (createdAt === null) {
      return false;
    }
    const minutes = (Date.now() - createdAt) / 60000;
    return minutes >= 10;
  }).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-background">
      <KdsSocketManager />

      {isLoading && orders.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 data-testid="loader" className="w-8 h-8 text-teal animate-spin" />
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-error/10 border-b border-error/20 p-4 text-error text-center text-sm">
              {error}
            </div>
          )}

          <div className="border-b border-white/5 bg-surface/50 px-4 py-3 backdrop-blur-md sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal/70">Terminal Cuisine</p>
                <div className="mt-1 flex items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight text-white">Flux Commandes</h1>
                  <span className="flex h-6 items-center rounded-full bg-teal/10 px-2.5 text-[11px] font-bold text-teal ring-1 ring-inset ring-teal/20">
                    {orders.length} TICKETS
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 sm:w-full lg:w-[32rem]">
                <div className="flex flex-col rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.05]">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <ChefHat size={14} className="text-teal" />
                    <span>Actifs</span>
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-white">{orders.length}</div>
                </div>
                
                <div className="flex flex-col rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.05]">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <ReceiptText size={14} className="text-teal" />
                    <span>Lignes</span>
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-white">{totalItems}</div>
                </div>
                
                <div className={`flex flex-col rounded-xl border border-white/5 p-3 transition-all ${urgentOrders > 0 ? 'bg-amber/10 ring-1 ring-amber/20' : 'bg-white/[0.03]'}`}>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Clock3 size={14} className={urgentOrders > 0 ? 'text-amber' : 'text-teal'} />
                    <span>Urgent</span>
                  </div>
                  <div className={`mt-1 text-2xl font-semibold ${urgentOrders > 0 ? 'text-amber animate-pulse' : 'text-white'}`}>
                    {urgentOrders}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            ref={scrollRef}
            onWheel={handleWheel}
            data-testid="kds-scroll-rail"
            className="flex flex-1 gap-4 overflow-x-auto overflow-y-hidden px-4 py-6 select-none sm:gap-6 sm:px-6"
          >
            {orders.map((order) => (
              <div key={order.id} className="h-full w-[19rem] flex-shrink-0 animate-enter">
                <TicketCard order={order} isNew={newOrderIds.has(order.id)} />
              </div>
            ))}

            {orders.length === 0 && !isLoading && (
              <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/5 bg-surface/30 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal mb-4">
                  <ChefHat size={32} />
                </div>
                <p className="text-xl font-semibold text-white">Cuisine Vide</p>
                <p className="mt-1 text-sm text-slate-400 max-w-xs">Toutes les commandes ont été traitées. Reposez-vous en attendant les suivantes !</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default KdsPage;
