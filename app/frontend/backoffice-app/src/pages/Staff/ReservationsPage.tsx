import React, { useState, useEffect } from 'react';
import { reservationApi } from '../../api/reservations';
import type { Reservation } from '../../types/reservations';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Search,
  MoreVertical
} from 'lucide-react';

import { Skeleton } from '../../components/ui/Skeleton';

export const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchReservations = async () => {
    try {
      const res = await reservationApi.getReservations();
      setReservations(res.data);
    } catch (err) {
      console.error('Failed to fetch reservations', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <Skeleton className="w-48 h-8" />
                <Skeleton className="w-64 h-4" />
            </div>
            <Skeleton className="w-32 h-10 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-2">
            <Skeleton className="h-20 rounded-[2rem]" />
            <Skeleton className="h-20 rounded-[2rem]" />
            <Skeleton className="h-20 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  const handleStatusUpdate = async (id: number, action: 'confirm' | 'cancel') => {
    try {
      if (action === 'confirm') {
        await reservationApi.confirmReservation(id);
      } else {
        await reservationApi.cancelReservation(id);
      }
      fetchReservations();
    } catch (err) {
      console.error(`Failed to ${action} reservation`, err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMEE': return 'bg-primary text-on-primary border-on-surface';
      case 'ANNULEE': return 'bg-error text-on-error border-on-surface';
      case 'EN_ATTENTE': return 'bg-secondary text-on-secondary border-on-surface';
      case 'TERMINEE': return 'bg-surface-container-highest text-on-surface border-on-surface opacity-50';
      default: return 'bg-surface-container text-on-surface border-on-surface';
    }
  };

  const filteredReservations = reservations.filter(res => {
    const matchesFilter = filter === 'ALL' ? true : res.statut === filter;
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch === '' ||
      (res.user_username || 'ANONYMOUS GUEST').toLowerCase().includes(normalizedSearch);

    return matchesFilter && matchesSearch;
  });

  const statusLabel = (status: string) =>
    status === 'ALL' ? 'VIEW ALL' : status.replace('_', ' ');

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div className="space-y-3">
          <h1 className="text-display-lg text-[32px] text-on-surface leading-none">Reservations Admin</h1>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-secondary"></div>
            <span className="text-ui-data-dense text-on-surface-variant font-bold">
              Booking lifecycle management
            </span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-4">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors"  strokeWidth={2.5}/>
                <input 
                    type="text" 
                    placeholder="SEARCH GUEST IDENTITY..."
                    aria-label="Search guest identity"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full sm:w-[280px] pl-12 pr-4 py-3 rounded-md bg-background border border-outline text-ui-data-dense font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-on-surface-variant/50"
                />
            </div>
            <div className="flex flex-wrap rounded-lg bg-surface-container border border-outline p-1">
                {['ALL', 'EN_ATTENTE', 'CONFIRMEE', 'ANNULEE'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`rounded-md px-4 py-2 text-ui-label-bold text-[9px] transition-all ${filter === f ? 'bg-primary text-on-primary font-black shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'}`}
                    >
                        {statusLabel(f)}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredReservations.map((res) => (
          <div 
            key={res.id} 
            className="group rounded-lg border border-outline bg-surface-container p-5 md:p-6 transition-colors hover:border-primary/60"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 w-full">
              <div className="flex items-start gap-4 md:gap-5">
              <div className="w-20 h-14 rounded-md bg-background border border-outline flex flex-col items-center justify-center text-primary shrink-0">
                  <Calendar className="w-5 h-5 mb-1"  strokeWidth={2.5}/>
                  <span className="text-ui-data-dense font-black text-[9px]">
                      {new Date(res.date_reservation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase()}
                  </span>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <h3 className="text-ui-label-bold text-sm md:text-base text-on-surface font-black tracking-[0.08em]">
                    {res.user_username || 'ANONYMOUS GUEST'}
                  </h3>
                  <span className={`w-fit rounded-full px-3 py-1 border text-[9px] font-black uppercase tracking-[0.18em] ${getStatusColor(res.statut)}`}>
                      {res.statut.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <div className="flex items-center gap-2 rounded-full border border-outline bg-background px-3 py-2 text-ui-data-dense font-bold text-on-surface">
                      <Clock className="w-4 h-4 text-primary"  strokeWidth={2.5}/>
                      <span>{res.heure_debut} — {res.heure_fin}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-outline bg-background px-3 py-2 text-ui-data-dense font-bold text-on-surface">
                      <Users className="w-4 h-4 text-primary"  strokeWidth={2.5}/>
                      <span>{res.nombre_personnes} COUVERTS</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-outline bg-background px-3 py-2 text-ui-data-dense font-bold text-on-surface">
                      <div className="w-4 h-4 border-2 border-primary flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-primary" />
                      </div>
                      <span>UNIT #{res.table_numero || res.table}</span>
                  </div>
                </div>
                {res.notes && (
                    <div className="rounded-md bg-background px-4 py-3 border border-outline text-ui-data-dense font-bold text-on-surface-variant italic">
                      “{res.notes}”
                    </div>
                )}
              </div>
              </div>

            <div className="flex items-center gap-3 w-full lg:w-auto lg:justify-end">
              {res.statut === 'EN_ATTENTE' && (
                <>
                  <button 
                    onClick={() => handleStatusUpdate(res.id, 'confirm')}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-3 rounded-md px-5 py-3 bg-primary text-on-primary border border-primary text-ui-button font-ui-button hover:brightness-105 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4"  strokeWidth={2.5}/>
                    CONFIRM
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(res.id, 'cancel')}
                    aria-label={`Cancel booking for ${res.user_username || 'anonymous guest'}`}
                    title={`Cancel booking for ${res.user_username || 'anonymous guest'}`}
                    className="rounded-md p-3 bg-background border border-outline text-error hover:border-error hover:bg-error/10 transition-all"
                  >
                    <XCircle className="w-5 h-5"  strokeWidth={2.5}/>
                  </button>
                </>
              )}
              
              {res.statut === 'CONFIRMEE' && (
                 <button 
                  onClick={() => handleStatusUpdate(res.id, 'cancel')}
                  className="flex-1 lg:flex-none rounded-md px-5 py-3 bg-background border border-outline text-ui-button font-ui-button text-on-surface-variant hover:text-error hover:border-error transition-all"
                 >
                   CANCEL BOOKING
                 </button>
              )}

              <button
                  aria-label={`Open actions for ${res.user_username || 'anonymous guest'}`}
                  title={`Open actions for ${res.user_username || 'anonymous guest'}`}
                  className="rounded-md p-3 text-on-surface-variant hover:bg-background hover:text-primary transition-colors"
              >
                  <MoreVertical className="w-5 h-5"  strokeWidth={2.5}/>
              </button>
            </div>
            </div>
          </div>
        ))}

        {filteredReservations.length === 0 && (
          <div className="rounded-lg border border-dashed border-outline py-20 flex flex-col items-center justify-center text-on-surface-variant">
              <Calendar className="w-16 h-10 mb-6"  strokeWidth={2.5}/>
              <p className="text-display-lg text-3xl italic tracking-tight text-on-surface">No Bookings Logged</p>
              <p className="text-ui-label-bold text-[11px] mt-4 tracking-[0.24em]">System clear for selected filter</p>
              <span className="sr-only">Aucune réservation prévue.</span>
          </div>
        )}
      </div>
    </div>
  );
};
