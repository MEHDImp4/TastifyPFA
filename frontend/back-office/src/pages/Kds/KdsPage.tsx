import React, { useEffect, useRef } from 'react';
import { useKdsStore } from './store/useKdsStore';
import { KdsSocketManager } from './KdsSocketManager';
import { TicketCard } from './components/TicketCard';
import { Loader2 } from 'lucide-react';

export const KdsPage: React.FC = () => {
  const { orders, isLoading, error, fetchOrders } = useKdsStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-[#1a323b]">
        <Loader2 data-testid="loader" className="w-8 h-8 text-teal animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#1a323b] overflow-hidden">
      <KdsSocketManager />
      
      {error && (
        <div className="bg-red/10 border-b border-red/20 p-4 text-red text-center text-sm">
          {error}
        </div>
      )}

      <div 
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex-1 flex gap-6 p-6 overflow-x-auto snap-x scroll-smooth select-none"
      >
        {orders.map((order) => (
          <div key={order.id} className="snap-start flex-shrink-0 h-full">
            <TicketCard order={order} />
          </div>
        ))}

        {orders.length === 0 && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-foreground-muted opacity-50">
            <p className="text-xl font-medium">Cuisine Vide</p>
            <p className="text-sm">En attente de nouvelles commandes...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KdsPage;
