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
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Table as TableIcon
} from 'lucide-react';

import { Skeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const reservationsPerPage = 3;
  const [totalCount, setTotalCount] = useState(0);

  // Dropdown state - tracking by ID
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<number | null>(null);

  const fetchReservations = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const res = await reservationApi.getReservationsPage({
        page,
        page_size: reservationsPerPage,
        search: search.trim() || undefined,
        statut: filter === 'ALL' ? undefined : filter,
      });
      setReservations(res.data.results);
      setTotalCount(res.data.count);
    } catch (err) {
      console.error('Failed to fetch reservations', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [currentPage, search, filter]);

  useEffect(() => {
    // Global click listener to close any open dropdowns
    const handleGlobalClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 p-8 space-y-8">
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <Skeleton className="w-48 h-8" />
                <Skeleton className="w-64 h-4" />
            </div>
            <Skeleton className="w-32 h-10 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-2">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
        </div>
      </div>
    );
  }

  const handleStatusUpdate = async (id: number, action: 'confirm' | 'cancel') => {
    setActiveMenuId(null);
    try {
      if (action === 'confirm') {
        await reservationApi.confirmReservation(id);
        toast.success('Réservation confirmée');
      } else {
        await reservationApi.cancelReservation(id);
        toast.warning('Réservation annulée');
      }
      fetchReservations();
    } catch (err) {
      toast.error('Opération impossible');
      console.error(`Failed to ${action} reservation`, err);
    }
  };

  const confirmDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent global click from closing it before we can see the modal
    setReservationToDelete(id);
    setIsDeleteModalOpen(true);
    setActiveMenuId(null);
  };

  const executeDelete = async () => {
    if (!reservationToDelete) return;
    try {
        await reservationApi.cancelReservation(reservationToDelete);
        toast.success('Réservation supprimée');
        fetchReservations();
    } catch (err) {
        toast.error('Suppression impossible');
    }
    setReservationToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMEE': return 'bg-on-background text-background border-on-background';
      case 'ANNULEE': return 'bg-error text-on-error border-error';
      case 'EN_ATTENTE': return 'bg-surface-container-highest text-on-surface-variant border-outline';
      case 'TERMINEE': return 'bg-surface-container text-on-surface opacity-30 border-outline';
      default: return 'bg-surface-container text-on-surface border-outline';
    }
  };

  const statusLabel = (status: string) =>
    status === 'ALL' ? 'Tout voir' : status.replace('_', ' ');

  const totalPages = Math.max(1, Math.ceil(totalCount / reservationsPerPage));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-body overflow-hidden">
      
      {/* Header */}
      <header className="flex-none px-staff-margin min-h-20 border-b border-outline bg-surface py-3">
        <div className="max-w-[1400px] mx-auto min-h-14 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 aria-label="Reservations Admin" className="text-sm font-bold text-on-background tracking-widest">Réservations</h1>
          </div>
          
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto">
              <div className="relative group w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-on-background transition-colors"  strokeWidth={2}/>
                  <input 
                      type="text" 
                      placeholder="Rechercher un client..."
                      aria-label="Rechercher client"
                      value={search}
                      onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
                      className="field-control w-full sm:w-56 pl-10 pr-3 text-[10px] uppercase"
                  />
              </div>
              <div className="flex max-w-full overflow-x-auto rounded border border-outline bg-background p-0.5 no-scrollbar">
                  {['ALL', 'EN_ATTENTE', 'CONFIRMEE', 'ANNULEE'].map(f => (
                      <button
                          key={f}
                          onClick={() => { setFilter(f); setCurrentPage(1); }}
                          className={`min-h-[44px] whitespace-nowrap rounded px-3 text-[8px] font-bold tracking-widest uppercase transition-all ${filter === f ? 'bg-on-background text-background' : 'text-on-background hover:bg-surface-container-high'}`}
                      >
                          {statusLabel(f)}
                      </button>
                  ))}
              </div>
          </div>
        </div>
      </header>

      {/* List Body */}
      <main tabIndex={0} className="flex-1 overflow-y-auto custom-scrollbar px-staff-margin py-8">
        <div className="max-w-[1400px] mx-auto space-y-4 grid grid-cols-1 gap-4">
          {reservations.map((res) => {
            const guestName = res.user_username
              || res.client_details?.username
              || `${res.client_details?.first_name || ''} ${res.client_details?.last_name || ''}`.trim()
              || null;
            const tableNumber = res.table_numero || res.table_details?.numero || res.table;

            return (
            <div 
              key={res.id} 
              className="group rounded-lg atelier-card p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 w-full"
            >
                <div className="flex items-start gap-6">
                  <div className="w-20 h-16 rounded border border-outline bg-surface-container-high flex flex-col items-center justify-center text-on-background shrink-0">
                      <Calendar className="w-5 h-5 mb-1 opacity-20"  strokeWidth={1.5}/>
                      <span className="text-[10px] font-bold">
                          {new Date(res.date_reservation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase()}
                      </span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                      <h3 className="text-base text-on-background font-bold tracking-wider uppercase">
                        {guestName || <>Client sans compte</>}
                      </h3>
                      <span className={`w-fit rounded px-3 py-1 border text-[9px] font-bold uppercase tracking-widest ${getStatusColor(res.statut)}`}>
                          {res.statut.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5 opacity-20" strokeWidth={2}/>
                          <span>{res.heure_debut} — {res.heure_fin}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                          <Users className="w-3.5 h-3.5 opacity-20" strokeWidth={2}/>
                          <span>{res.nombre_personnes} COUVERTS</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                          <TableIcon className="w-3.5 h-3.5 opacity-20" strokeWidth={2}/>
                          <span>Table #{tableNumber}</span>
                      </div>
                    </div>
                    {res.notes && (
                        <div className="rounded border border-outline bg-background/50 px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
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
                      aria-label="Confirmer"
                      className="btn-primary flex-1 lg:flex-none h-10 px-6 uppercase text-[10px]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmer
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(res.id, 'cancel')}
                      aria-label="Annuler"
                      className="btn-icon text-error hover:border-error/30 hover:text-error"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </>
                )}
                
                {res.statut === 'CONFIRMEE' && (
                   <button 
                    onClick={() => handleStatusUpdate(res.id, 'cancel')}
                    aria-label="Annuler la réservation"
                    className="btn-secondary flex-1 lg:flex-none h-10 px-6 uppercase text-[10px] text-error hover:border-error"
                   >
                     Annuler
                   </button>
                )}

                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === res.id ? null : res.id); }}
                        className={`btn-icon ${activeMenuId === res.id ? 'bg-on-background text-background' : ''}`}
                        aria-label="Options"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === res.id && (
                        <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-2 w-56 bg-surface border border-outline rounded-lg z-50 overflow-hidden shadow-2xl"
                        >
                            <div className="p-2 space-y-1">
                                <button 
                                    onClick={() => { setActiveMenuId(null); toast.info('Détails bientôt disponibles'); }}
                                    className="w-full min-h-[44px] flex items-center gap-3 px-4 py-3 rounded hover:bg-background text-[10px] font-bold uppercase tracking-widest text-on-background transition-all"
                                >
                                    <Eye className="w-4 h-4" />
                                    Voir détails
                                </button>
                                <button 
                                    onClick={() => { setActiveMenuId(null); navigate('/salle'); }}
                                    className="w-full min-h-[44px] flex items-center gap-3 px-4 py-3 rounded hover:bg-background text-[10px] font-bold uppercase tracking-widest text-on-background transition-all"
                                >
                                    <TableIcon className="w-4 h-4" />
                                    Associer une table
                                </button>
                                <div className="h-px bg-outline my-1" />
                                <button 
                                    onClick={(e) => confirmDelete(e, res.id)}
                                    className="w-full min-h-[44px] flex items-center gap-3 px-4 py-3 rounded hover:bg-error/5 text-[10px] font-bold uppercase tracking-widest text-error transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
              </div>
            </div>
            );
          })}

          {reservations.length === 0 && (
            <div className="rounded border border-dashed border-outline py-32 flex flex-col items-center justify-center opacity-20">
                <Calendar className="w-12 h-12 mb-4" strokeWidth={1}/>
                <p className="text-xl font-bold tracking-widest">Aucune réservation</p>
            </div>
          )}
        </div>
      </main>

      {/* Pagination Footer */}
      <footer className="flex-none px-staff-margin h-20 border-t border-outline bg-surface">
        <div className="max-w-[1400px] mx-auto h-full flex items-center justify-center">
          {totalPages > 1 ? (
            <div className="flex items-center gap-8">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="min-h-[44px] flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-background hover:text-on-surface-variant disabled:opacity-30 transition-all"
                >
                    <ChevronLeft className="w-4 h-4" /> Précédent
                </button>
                <div className="flex items-center gap-4 text-[10px] font-bold text-on-surface-variant">
                    <span className="opacity-40 uppercase tracking-widest">Page</span>
                    <div className="flex items-center gap-2 font-mono text-sm">
                        <span className="text-on-background font-bold">{currentPage}</span>
                        <span className="opacity-20">/</span>
                        <span>{totalPages}</span>
                    </div>
                </div>
                <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="min-h-[44px] flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-background hover:text-on-surface-variant disabled:opacity-30 transition-all"
                >
                    Suivant <ChevronRight className="w-4 h-4" />
                </button>
            </div>
          ) : (
             <p className="text-[9px] font-bold tracking-widest text-on-surface-variant">Fin de la liste</p>
          )}
        </div>
      </footer>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="Supprimer la réservation"
        message="Confirmez-vous la suppression définitive de cette réservation ?"
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};

