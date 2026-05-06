import React, { useState, useEffect } from 'react';
import { Drawer } from '../../components/ui/Drawer';
import { Reservation, ReservationFormData } from '@shared/types/reservations';
import axiosInstance from '@shared/auth/axiosInstance';
import { Table } from '@shared/types/tables';
import { Loader2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reservation?: Reservation | null;
}

const STATUTS = [
  { value: 'CONFIRMEE', label: 'Confirmée' },
  { value: 'ANNULEE', label: 'Annulée' },
  { value: 'PRESENTE', label: 'Arrivée' },
  { value: 'ABSENTE', label: 'Absente' },
];

export const ReservationDrawer: React.FC<Props> = ({ isOpen, onClose, onSuccess, reservation }) => {
  const isEditing = !!reservation;

  const [formData, setFormData] = useState<ReservationFormData>({
    date_reservation: new Date().toISOString().split('T')[0],
    heure_debut: '19:00',
    heure_fin: '21:00',
    nombre_personnes: 2,
    table: '',
    statut: 'CONFIRMEE',
    notes: '',
  });

  const [tables, setTables] = useState<Table[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && reservation) {
      setFormData({
        date_reservation: reservation.date_reservation,
        heure_debut: reservation.heure_debut.slice(0, 5),
        heure_fin: reservation.heure_fin.slice(0, 5),
        nombre_personnes: reservation.nombre_personnes,
        table: reservation.table,
        statut: reservation.statut,
        notes: reservation.notes || '',
      });
      // Pre-populate tables just with the current table if we don't refetch
      setTables([
        { id: reservation.table, numero: reservation.table_details?.numero || 0, capacite: reservation.table_details?.capacite || 0 } as Table
      ]);
    } else if (isOpen) {
      setFormData({
        date_reservation: new Date().toISOString().split('T')[0],
        heure_debut: '19:00',
        heure_fin: '21:00',
        nombre_personnes: 2,
        table: '',
        statut: 'CONFIRMEE',
        notes: '',
      });
      setTables([]);
    }
  }, [isOpen, reservation]);

  useEffect(() => {
    if (isOpen && !isEditing) {
      const fetchAvailableTables = async () => {
        if (!formData.date_reservation || !formData.heure_debut || !formData.heure_fin || !formData.nombre_personnes) return;
        setLoadingTables(true);
        try {
          const params = new URLSearchParams({
            date: formData.date_reservation,
            heure_debut: formData.heure_debut + ':00',
            heure_fin: formData.heure_fin + ':00',
            nombre_personnes: formData.nombre_personnes.toString(),
          });
          const response = await axiosInstance.get(`/reservations/available_tables/?${params.toString()}`);
          setTables(response.data.filter((t: any) => t.est_disponible));
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingTables(false);
        }
      };

      const debounce = setTimeout(() => {
        fetchAvailableTables();
      }, 500);

      return () => clearTimeout(debounce);
    }
  }, [isOpen, isEditing, formData.date_reservation, formData.heure_debut, formData.heure_fin, formData.nombre_personnes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const dataToSubmit = {
        ...formData,
        heure_debut: formData.heure_debut.length === 5 ? formData.heure_debut + ':00' : formData.heure_debut,
        heure_fin: formData.heure_fin.length === 5 ? formData.heure_fin + ':00' : formData.heure_fin,
      };

      if (isEditing) {
        await axiosInstance.patch(`/reservations/${reservation.id}/`, dataToSubmit);
      } else {
        await axiosInstance.post('/reservations/', dataToSubmit);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || err.response?.data?.error || 'Une erreur est survenue';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 bg-surface/50 shrink-0 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isEditing ? 'Modifier la réservation' : 'Nouvelle réservation'}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-foreground-muted hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {error && (
              <div className="bg-error/10 border border-error/20 p-4 rounded-xl text-error text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-teal">Détails Date & Heure</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">
                    Date <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_reservation"
                    required
                    disabled={isEditing}
                    value={formData.date_reservation}
                    onChange={handleChange}
                    className="w-full bg-surface-elevated border border-white/5 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal disabled:opacity-50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">
                    Couverts <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="nombre_personnes"
                    required
                    min="1"
                    max="20"
                    disabled={isEditing}
                    value={formData.nombre_personnes}
                    onChange={handleChange}
                    className="w-full bg-surface-elevated border border-white/5 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal disabled:opacity-50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">
                    Heure Début <span className="text-error">*</span>
                  </label>
                  <input
                    type="time"
                    name="heure_debut"
                    required
                    disabled={isEditing}
                    value={formData.heure_debut}
                    onChange={handleChange}
                    className="w-full bg-surface-elevated border border-white/5 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal disabled:opacity-50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">
                    Heure Fin <span className="text-error">*</span>
                  </label>
                  <input
                    type="time"
                    name="heure_fin"
                    required
                    disabled={isEditing}
                    value={formData.heure_fin}
                    onChange={handleChange}
                    className="w-full bg-surface-elevated border border-white/5 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal disabled:opacity-50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-teal">Table & Statut</h3>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">
                  Table {loadingTables && <Loader2 className="w-3 h-3 inline animate-spin text-teal" />}
                  <span className="text-error">*</span>
                </label>
                <select
                  name="table"
                  required
                  disabled={isEditing}
                  value={formData.table}
                  onChange={handleChange}
                  className="w-full bg-surface-elevated border border-white/5 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal disabled:opacity-50 transition-all appearance-none"
                >
                  <option value="">Sélectionner une table...</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>
                      Table {t.numero} ({t.capacite} places)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">
                  Statut
                </label>
                <select
                  name="statut"
                  value={formData.statut}
                  onChange={handleChange}
                  className="w-full bg-surface-elevated border border-white/5 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all appearance-none"
                >
                  {STATUTS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-teal">Notes (Optionnel)</h3>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Demandes particulières (ex: Allergies, anniversaire...)"
                className="w-full bg-surface-elevated border border-white/5 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal resize-none transition-all"
              />
            </div>
          </div>

          <div className="p-6 border-t border-white/10 bg-surface/50 shrink-0 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm font-bold text-foreground-muted bg-white/5 hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-white bg-teal hover:bg-teal/90 shadow-lg shadow-teal/20 transition-all flex items-center justify-center min-w-[140px] active:scale-[0.98] disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : isEditing ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </Drawer>
  );
};
