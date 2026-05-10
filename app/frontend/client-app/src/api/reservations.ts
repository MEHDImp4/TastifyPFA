import { api } from './axios';

export interface Reservation {
  id?: number;
  table: number;
  date_reservation: string;
  heure_debut: string;
  heure_fin: string;
  nombre_personnes: number;
  notes?: string;
  statut?: string;
}

export const reservationApi = {
  getAvailableTables: (params: { date: string; heure_debut: string; heure_fin: string; nombre_personnes: number }) => 
    api.get<any[]>('/reservations/available_tables/', { params }),
  createReservation: (data: Reservation) => api.post<Reservation>('/reservations/', data),
  getMyReservations: () => api.get<Reservation[]>('/reservations/'),
};
