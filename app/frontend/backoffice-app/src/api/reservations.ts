import { api } from './axios';
import type { Reservation } from '../types/reservations';
import type { PaginatedResponse, PaginationParams } from './pagination';
import { toPaginatedResponse } from './pagination';

export const reservationApi = {
  getReservations: (params?: any) => api.get<Reservation[]>('/reservations/', { params }),
  getReservationsPage: (params: PaginationParams) => api
    .get<PaginatedResponse<Reservation> | Reservation[]>('/reservations/', { params })
    .then(res => ({ ...res, data: toPaginatedResponse(res.data) })),
  updateReservationStatus: (id: number, statut: string) => api.patch<Reservation>(`/reservations/${id}/`, { statut }),
  confirmReservation: (id: number) => api.patch<Reservation>(`/reservations/${id}/confirmer/`, {}),
  cancelReservation: (id: number) => api.patch<Reservation>(`/reservations/${id}/annuler/`, {}),
  deleteReservation: (id: number) => api.delete(`/reservations/${id}/`),
};
