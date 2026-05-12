import React, { useState, useEffect } from 'react';
import { reservationApi } from '../../api/reservations';
import type { Reservation } from '../../types/reservations';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Search,
  MoreVertical
} from 'lucide-react';

export const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

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
      case 'CONFIRMEE': return 'bg-teal/10 text-teal border-teal/20';
      case 'ANNULEE': return 'bg-terracotta/10 text-terracotta border-terracotta/20';
      case 'EN_ATTENTE': return 'bg-amber/10 text-amber border-amber/20';
      case 'TERMINEE': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-white/5 text-white border-white/10';
    }
  };

  const filteredReservations = reservations.filter(res => {
    if (filter === 'ALL') return true;
    return res.statut === filter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Réservations</h1>
          <p className="text-gray-400 mt-1">Gérez les réservations et l'occupation des tables.</p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Chercher un client..."
                    className="pl-10 pr-4 py-2 bg-dark-surface border border-white/5 rounded-xl text-sm focus:outline-none focus:border-teal transition-colors"
                />
            </div>
            <div className="flex bg-dark-surface p-1 rounded-xl border border-white/5">
                {['ALL', 'EN_ATTENTE', 'CONFIRMEE'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-teal text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        {f === 'ALL' ? 'Tout' : f.replace('_', ' ')}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReservations.map((res) => (
            <div 
              key={res.id} 
              className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-dark-surface rounded-[2rem] border border-white/10 hover:border-teal/30 transition-all shadow-xl"
            >
              <div className="flex items-center gap-6 mb-4 md:mb-0">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex flex-col items-center justify-center text-teal">
                    <Calendar className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {new Date(res.date_reservation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white capitalize">{res.user_username || 'Client'}</h3>
                    <span className={`px-3 py-0.5 rounded-full text-[9px] font-bold border ${getStatusColor(res.statut)}`}>
                        {res.statut}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-teal" />
                        <span>{res.heure_debut} - {res.heure_fin}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-teal" />
                        <span>{res.nombre_personnes} couverts</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-orange/20 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange" />
                        </div>
                        <span className="font-bold text-white">Table #{res.table_numero || res.table}</span>
                    </div>
                  </div>
                  {res.notes && (
                      <p className="mt-3 text-xs text-gray-500 italic bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
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
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-teal text-white rounded-xl font-bold hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-teal/10"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmer
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(res.id, 'cancel')}
                      className="p-3 bg-white/5 text-gray-400 rounded-xl hover:text-terracotta hover:bg-terracotta/10 transition-all"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </>
                )}
                
                {res.statut === 'CONFIRMEE' && (
                   <button 
                    onClick={() => handleStatusUpdate(res.id, 'cancel')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-gray-400 rounded-xl font-bold hover:text-terracotta hover:bg-terracotta/10 transition-all"
                   >
                     Annuler
                   </button>
                )}

                <button className="p-3 text-gray-500 hover:text-white transition-colors">
                    <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {filteredReservations.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500 opacity-30">
                <Calendar className="w-16 h-16 mb-4" />
                <p>Aucune réservation trouvée.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
