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
        <div className="grid grid-cols-1 gap-4">
            <Skeleton className="h-32 rounded-[2rem]" />
            <Skeleton className="h-32 rounded-[2rem]" />
            <Skeleton className="h-32 rounded-[2rem]" />
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
      case 'CONFIRMEE': return 'bg-primary/10 text-primary border-primary/20';
      case 'ANNULEE': return 'bg-error/10 text-error border-error/20';
      case 'EN_ATTENTE': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'TERMINEE': return 'bg-outline-variant/10 text-outline border-outline/20';
      default: return 'bg-surface-container text-on-surface border-outline-variant/30';
    }
  };

  const filteredReservations = reservations.filter(res => {
    const matchesFilter = filter === 'ALL' ? true : res.statut === filter;
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch === '' ||
      (res.user_username || 'Client').toLowerCase().includes(normalizedSearch);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#301400' }}>Réservations</h1>
          <p className="mt-1 font-medium" style={{ color: '#53443a' }}>Gérez les réservations et l'occupation des tables.</p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#53443a' }} />
                <input 
                    type="text" 
                    placeholder="Chercher un client..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-10 pr-4 py-2 bg-surface-container border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors font-bold"
                    style={{ color: '#301400' }}
                />
            </div>
            <div className="flex bg-surface-container p-1 rounded-xl border border-outline-variant/30">
                {['ALL', 'EN_ATTENTE', 'CONFIRMEE', 'ANNULEE'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-primary text-on-primary shadow-lg' : 'hover:text-primary'}`}
                        style={{ color: filter === f ? undefined : '#53443a' }}
                    >
                        {f === 'ALL' ? 'Tout' : f.replace('_', ' ')}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredReservations.map((res) => (
          <div 
            key={res.id} 
            className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 tonal-card hover:border-primary/30 transition-all"
          >
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <div className="w-16 h-16 bg-surface-container rounded-2xl flex flex-col items-center justify-center text-primary border border-outline-variant/30">
                  <Calendar className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#53443a' }}>
                      {new Date(res.date_reservation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold capitalize" style={{ color: '#301400' }}>{res.user_username || 'Client'}</h3>
                  <span className={`px-3 py-0.5 rounded-full text-[9px] font-bold border ${getStatusColor(res.statut)}`}>
                      {res.statut}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-bold" style={{ color: '#53443a' }}>{res.heure_debut} - {res.heure_fin}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-bold" style={{ color: '#53443a' }}>{res.nombre_personnes} couverts</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                      <span className="font-bold" style={{ color: '#301400' }}>Table #{res.table_numero || res.table}</span>
                  </div>
                </div>
                {res.notes && (
                    <p className="mt-3 text-xs italic bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/30" style={{ color: '#53443a' }}>
                      "{res.notes}"
                    </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {res.statut === 'EN_ATTENTE' && (
                <>
                  <button 
                    onClick={() => handleStatusUpdate(res.id, 'confirm')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-primary/10"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmer
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(res.id, 'cancel')}
                    className="p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl hover:text-error hover:bg-error-container/20 transition-all"
                    style={{ color: '#53443a' }}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {res.statut === 'CONFIRMEE' && (
                 <button 
                  onClick={() => handleStatusUpdate(res.id, 'cancel')}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl font-bold hover:text-error hover:bg-error-container/20 transition-all"
                  style={{ color: '#53443a' }}
                 >
                   Annuler
                 </button>
              )}

              <button className="p-3 hover:text-primary transition-colors" style={{ color: '#53443a' }}>
                  <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {filteredReservations.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center" style={{ color: '#53443a', opacity: 0.5 }}>
              <Calendar className="w-16 h-16 mb-4" />
              <p className="font-bold">Aucune réservation trouvée.</p>
          </div>
        )}
      </div>
    </div>
  );
};
