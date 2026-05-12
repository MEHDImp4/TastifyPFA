import { api } from './axios';
import type { Reservation } from '../types/reservations';

export const reservationApi = {
  getReservations: (params?: any) => api.get<Reservation[]>('/reservations/', { params }),
  updateReservationStatus: (id: number, statut: string) => api.patch<Reservation>(`/reservations/${id}/`, { statut }),
  confirmReservation: (id: number) => api.patch<Reservation>(`/reservations/${id}/confirmer/`, {}),
  cancelReservation: (id: number) => api.patch<Reservation>(`/reservations/${id}/annuler/`, {}),
};
