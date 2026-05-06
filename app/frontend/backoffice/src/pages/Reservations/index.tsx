import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Calendar, Filter, Loader2, CalendarRange, Clock } from 'lucide-react';
import { Reservation } from '@shared/types/reservations';
import { getReservations } from './reservationService';
import { useStaffWebSocket } from '@shared/websocket/WebSocketProvider';
import { ReservationDrawer } from './ReservationDrawer';
import { Pagination } from '../../components/ui/Pagination';

const STATUTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'CONFIRMEE', label: 'Confirmée' },
  { value: 'ANNULEE', label: 'Annulée' },
  { value: 'PRESENTE', label: 'Arrivée' },
  { value: 'ABSENTE', label: 'Absente' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'CONFIRMEE':
      return <span className="px-2.5 py-1 rounded-full bg-teal/10 text-teal text-[10px] font-black uppercase tracking-widest border border-teal/20">Confirmée</span>;
    case 'ANNULEE':
      return <span className="px-2.5 py-1 rounded-full bg-error/10 text-error text-[10px] font-black uppercase tracking-widest border border-error/20">Annulée</span>;
    case 'PRESENTE':
      return <span className="px-2.5 py-1 rounded-full bg-amber/10 text-amber text-[10px] font-black uppercase tracking-widest border border-amber/20">Arrivée</span>;
    case 'ABSENTE':
      return <span className="px-2.5 py-1 rounded-full bg-white/5 text-foreground-muted text-[10px] font-black uppercase tracking-widest border border-white/10">Absente</span>;
    default:
      return <span className="px-2.5 py-1 rounded-full bg-surface-elevated text-foreground-muted text-[10px] font-black uppercase tracking-widest border border-white/10">{status}</span>;
  }
};

const ReservationsPage: React.FC = () => {
  const { lastEvent } = useStaffWebSocket();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    date: '',
    statut: '',
    search: '',
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReservations(page, filters);
      setReservations(Array.isArray(data) ? data : []);
      setTotalPages(1);
    } catch (err: any) {
      console.error(err);
      setError('Impossible de charger les réservations.');
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  useEffect(() => {
    if (lastEvent?.type === 'reservation_created' || lastEvent?.type === 'reservation_updated' || lastEvent?.type === 'reservation_deleted') {
      void fetchReservations();
    }
  }, [lastEvent, fetchReservations]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const openDrawerForCreate = () => {
    setSelectedReservation(null);
    setIsDrawerOpen(true);
  };

  const openDrawerForEdit = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-8 animate-enter">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Réservations</h1>
          <p className="text-foreground-muted mt-1">Gérez les réservations et leur statut d'arrivée.</p>
        </div>
        <button
          onClick={openDrawerForCreate}
          className="min-h-11 inline-flex items-center gap-2 rounded-full bg-teal px-5 font-bold text-white transition-colors duration-200 hover:bg-teal/90 active:scale-[0.97]"
        >
          <Plus className="h-5 w-5" />
          Nouvelle Réservation
        </button>
      </header>

      <div className="bg-surface border border-white/5 rounded-3xl p-5 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              name="search"
              placeholder="Rechercher un client..."
              value={filters.search}
              onChange={handleFilterChange}
              className="w-full bg-background border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="w-full bg-background border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <select
              name="statut"
              value={filters.statut}
              onChange={handleFilterChange}
              className="w-full bg-background border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
            >
              {STATUTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 p-4 rounded-xl text-error text-sm font-medium">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-4 text-xs font-black text-foreground-muted uppercase tracking-widest whitespace-nowrap">ID</th>
                <th className="px-4 py-4 text-xs font-black text-foreground-muted uppercase tracking-widest whitespace-nowrap">Date & Heure</th>
                <th className="px-4 py-4 text-xs font-black text-foreground-muted uppercase tracking-widest whitespace-nowrap">Client</th>
                <th className="px-4 py-4 text-xs font-black text-foreground-muted uppercase tracking-widest whitespace-nowrap">Table & Couverts</th>
                <th className="px-4 py-4 text-xs font-black text-foreground-muted uppercase tracking-widest whitespace-nowrap">Statut</th>
                <th className="px-4 py-4 text-right text-xs font-black text-foreground-muted uppercase tracking-widest whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-teal animate-spin mx-auto" />
                  </td>
                </tr>
              ) : !reservations || reservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-foreground-muted text-sm">
                    Aucune réservation trouvée pour ces filtres.
                  </td>
                </tr>
              ) : (
                reservations.map((reservation) => (
                  <tr key={reservation.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-white/50">
                      #{reservation.id.toString().padStart(4, '0')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                          <CalendarRange className="w-3.5 h-3.5 text-teal" />
                          {reservation.date_reservation}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                          <Clock className="w-3 h-3" />
                          {reservation.heure_debut.slice(0, 5)} - {reservation.heure_fin.slice(0, 5)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-white">
                        {reservation.client_details ? `${reservation.client_details.first_name} ${reservation.client_details.last_name}` : '—'}
                      </div>
                      <div className="text-xs text-foreground-muted mt-0.5">
                        {reservation.client_details?.username}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-white">
                        Table {reservation.table_details?.numero}
                      </div>
                      <div className="text-xs text-foreground-muted mt-0.5">
                        {reservation.nombre_personnes} pers.
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(reservation.statut)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => openDrawerForEdit(reservation)}
                        className="text-xs font-bold text-teal hover:text-teal/80 uppercase tracking-widest transition-colors"
                      >
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="pt-4 border-t border-white/5 flex justify-center">
            <Pagination 
              currentPage={page} 
              totalPages={totalPages} 
              onPageChange={setPage}
              pageSize={10}
              totalItems={reservations?.length || 0}
              itemLabel="réservations"
            />
          </div>
        )}
      </div>

      <ReservationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => fetchReservations()}
        reservation={selectedReservation}
      />
    </div>
  );
};

export default ReservationsPage;
