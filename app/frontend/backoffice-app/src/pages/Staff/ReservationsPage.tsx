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
import { motion, AnimatePresence } from 'framer-motion';
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

  // Dropdown state - tracking by ID
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<number | null>(null);

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
    
    // Global click listener to close any open dropdowns
    const handleGlobalClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 p-8 space-y-8 animate-in fade-in duration-500">
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
    setActiveMenuId(null);
    try {
      if (action === 'confirm') {
        await reservationApi.confirmReservation(id);
        toast.success('RÉSERVATION CONFIRMÉE');
      } else {
        await reservationApi.cancelReservation(id);
        toast.warning('RÉSERVATION ANNULÉE');
      }
      fetchReservations();
    } catch (err) {
      toast.error('ÉCHEC DE L\'OPÉRATION');
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
        toast.success('RÉSERVATION SUPPRIMÉE');
        fetchReservations();
    } catch (err) {
        toast.error('ÉCHEC DE SUPPRESSION');
    }
    setReservationToDelete(null);
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
      (res.user_username || 'CLIENT ANONYME').toLowerCase().includes(normalizedSearch);

    return matchesFilter && matchesSearch;
  });

  const statusLabel = (status: string) =>
    status === 'ALL' ? 'VOIR TOUT' : status.replace('_', ' ');

  const totalPages = Math.ceil(filteredReservations.length / reservationsPerPage);
  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * reservationsPerPage,
    currentPage * reservationsPerPage
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 -m-4 bg-background font-body animate-in fade-in duration-500 overflow-hidden">
      
      {/* Fixed Header Section - Ultra Compact */}
      <header className="flex-none px-staff-margin pt-6 pb-2 space-y-4">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1.5">
            <h1 className="text-xl md:text-2xl text-on-surface leading-none uppercase font-black italic tracking-tighter">Gestion Réservations</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-primary transition-colors"  strokeWidth={2.5}/>
                  <input 
                      type="text" 
                      placeholder="RECHERCHER..."
                      aria-label="Rechercher client"
                      value={search}
                      onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
                      className="w-full sm:w-[220px] pl-10 pr-3 py-2 rounded-lg bg-surface-container border border-outline text-[10px] font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-on-surface-variant/30 uppercase"
                  />
              </div>
              <div className="flex flex-wrap rounded-lg bg-surface-container border border-outline p-1">
                  {['ALL', 'EN_ATTENTE', 'CONFIRMEE', 'ANNULEE'].map(f => (
                      <button
                          key={f}
                          onClick={() => { setFilter(f); setCurrentPage(1); }}
                          className={`rounded-md px-3 py-1.5 text-[8px] font-black tracking-widest uppercase transition-all ${filter === f ? 'bg-primary text-on-primary font-black' : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'}`}
                      >
                          {statusLabel(f)}
                      </button>
                  ))}
              </div>
          </div>
        </div>
      </header>

      {/* Scrollable List Body */}
      <main className="flex-1 overflow-y-auto custom-scrollbar px-staff-margin py-4">
        <div className="max-w-[1400px] mx-auto space-y-4">
          {paginatedReservations.map((res) => (
            <div 
              key={res.id} 
              className="group rounded-lg border border-outline bg-surface-container p-5 md:p-6 transition-colors hover:border-primary/60 relative"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 w-full">
                <div className="flex items-start gap-4 md:gap-5">
                <div className="w-20 h-14 rounded-md bg-background border border-outline flex flex-col items-center justify-center text-primary shrink-0">
                    <Calendar className="w-5 h-5 mb-1"  strokeWidth={2.5}/>
                    <span className="text-[10px] font-black text-primary">
                        {new Date(res.date_reservation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase()}
                    </span>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <h3 className="text-sm md:text-base text-on-surface font-black tracking-[0.08em] uppercase">
                      {res.user_username || 'CLIENT ANONYME'}
                    </h3>
                    <span className={`w-fit rounded-full px-3 py-1 border text-[9px] font-black uppercase tracking-[0.18em] ${getStatusColor(res.statut)}`}>
                        {res.statut.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 md:gap-4">
                    <div className="flex items-center gap-2 rounded-full border border-outline bg-background px-3 py-2 text-[10px] font-black text-on-surface uppercase">
                        <Clock className="w-3.5 h-3.5 text-primary"  strokeWidth={2.5}/>
                        <span>{res.heure_debut} — {res.heure_fin}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-outline bg-background px-3 py-2 text-[10px] font-black text-on-surface uppercase">
                        <Users className="w-3.5 h-3.5 text-primary"  strokeWidth={2.5}/>
                        <span>{res.nombre_personnes} COUVERTS</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-outline bg-background px-3 py-2 text-[10px] font-black text-on-surface uppercase">
                        <div className="w-3.5 h-3.5 border-2 border-primary flex items-center justify-center">
                            <div className="w-1 h-1 bg-primary" />
                        </div>
                        <span>UNITÉ #{res.table_numero || res.table}</span>
                    </div>
                  </div>
                  {res.notes && (
                      <div className="rounded-md bg-background px-4 py-3 border border-outline text-[11px] font-bold text-on-surface-variant italic uppercase tracking-tight">
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
                      className="flex-1 lg:flex-none flex items-center justify-center gap-3 rounded-md px-6 py-3.5 bg-primary text-on-primary border border-primary text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4"  strokeWidth={2.5}/>
                      CONFIRMER
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(res.id, 'cancel')}
                      aria-label={`Annuler réservation pour ${res.user_username || 'client anonyme'}`}
                      title={`Annuler réservation pour ${res.user_username || 'client anonyme'}`}
                      className="rounded-md p-3.5 bg-background border border-outline text-error hover:border-error hover:bg-error/10 transition-all active:scale-90"
                    >
                      <XCircle className="w-5 h-5"  strokeWidth={2.5}/>
                    </button>
                  </>
                )}
                
                {res.statut === 'CONFIRMEE' && (
                   <button 
                    onClick={() => handleStatusUpdate(res.id, 'cancel')}
                    className="flex-1 lg:flex-none rounded-md px-6 py-3.5 bg-background border border-outline text-[10px] font-black text-on-surface-variant hover:text-error hover:border-error transition-all uppercase tracking-widest active:scale-95"
                   >
                     ANNULER RÉSERVATION
                   </button>
                )}

                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === res.id ? null : res.id); }}
                        aria-label={`Ouvrir actions pour ${res.user_username || 'client anonyme'}`}
                        title={`Ouvrir actions pour ${res.user_username || 'client anonyme'}`}
                        className={`rounded-md p-3 transition-colors ${activeMenuId === res.id ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-background hover:text-primary'}`}
                    >
                        <MoreVertical className="w-5 h-5"  strokeWidth={2.5}/>
                    </button>

                    <AnimatePresence>
                        {activeMenuId === res.id && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                                className="absolute right-0 top-full mt-2 w-56 bg-surface-container-high border border-outline-variant rounded-xl z-50 overflow-hidden"
                            >
                                <div className="p-2 space-y-1">
                                    <button 
                                        onClick={() => { setActiveMenuId(null); toast.info('FONCTIONNALITÉ DÉTAILS EN COURS...'); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all font-sans text-[11px] font-black uppercase tracking-widest text-on-surface-variant"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Voir Détails
                                    </button>
                                    <button 
                                        onClick={() => { setActiveMenuId(null); navigate('/salle'); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all font-sans text-[11px] font-black uppercase tracking-widest text-on-surface-variant"
                                    >
                                        <TableIcon className="w-4 h-4" />
                                        Associer Table
                                    </button>
                                    <div className="h-px bg-outline-variant/30 my-1" />
                                    <button 
                                        onClick={(e) => confirmDelete(e, res.id)}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-error/10 hover:text-error transition-all font-sans text-[11px] font-black uppercase tracking-widest text-error/70"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Supprimer
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
              </div>
              </div>
            </div>
          ))}

          {filteredReservations.length === 0 && (
            <div className="rounded-lg border border-dashed border-outline py-20 flex flex-col items-center justify-center text-on-surface-variant bg-surface-container/20">
                <Calendar className="w-16 h-10 mb-6 opacity-20"  strokeWidth={2.5}/>
                <p className="text-display-lg text-3xl font-black italic tracking-tighter text-on-surface uppercase opacity-20">Aucune Réservation</p>
                <p className="text-[10px] font-black mt-4 tracking-[0.24em] uppercase opacity-40">Registre vide pour le filtre sélectionné</p>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Pagination Controls Footer */}
      <footer className="flex-none px-staff-margin py-6 border-t border-outline-variant bg-surface-container-lowest">
        <div className="max-w-[1400px] mx-auto">
          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-12">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2.5 px-8 py-3.5 border border-outline-variant rounded-xl font-sans text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-10 active:scale-95 bg-surface-container"
                >
                    <ChevronLeft className="w-4 h-4 text-primary" />
                    Précédent
                </button>
                <div className="flex items-center gap-4">
                    <span className="font-sans text-[10px] font-black uppercase tracking-[0.25em] text-on-surface-variant opacity-60">Page</span>
                    <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant p-1.5 rounded-lg">
                        <span className="w-10 h-10 flex items-center justify-center bg-primary text-on-primary rounded-md font-mono text-base font-black">
                            {currentPage}
                        </span>
                        <span className="px-3 font-sans text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant opacity-40">/</span>
                        <span className="w-10 h-10 flex items-center justify-center font-mono text-base font-black text-on-surface opacity-60">
                            {totalPages}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2.5 px-8 py-3.5 border border-outline-variant rounded-xl font-sans text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-10 active:scale-95 bg-surface-container"
                >
                    Suivant
                    <ChevronRight className="w-4 h-4 text-primary" />
                </button>
            </div>
          ) : (
             <div className="flex justify-center">
                <p className="font-sans text-[9px] font-black uppercase tracking-[0.4em] text-on-surface-variant opacity-30">Fin du registre de réservations</p>
             </div>
          )}
        </div>
      </footer>

      {/* Custom Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="Supprimer Réservation"
        message="Êtes-vous sûr de vouloir supprimer définitivement cette réservation ? Cette action est irréversible."
        confirmLabel="SUPPRIMER"
        variant="danger"
      />
    </div>
  );
};
