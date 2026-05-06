import axiosInstance from '@shared/auth/axiosInstance';
import { Reservation, ReservationFormData } from '@shared/types/reservations';

export interface ReservationsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Reservation[];
}

export const getReservations = async (page = 1, filters?: { date?: string; statut?: string; search?: string }): Promise<ReservationsResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  if (filters?.date) params.append('date_reservation', filters.date);
  if (filters?.statut) params.append('statut', filters.statut);
  if (filters?.search) params.append('search', filters.search);

  const response = await axiosInstance.get('/reservations/', { params });
  return response.data;
};

export const createReservation = async (data: ReservationFormData): Promise<Reservation> => {
  const response = await axiosInstance.post('/reservations/', data);
  return response.data;
};

export const updateReservation = async (id: number, data: Partial<ReservationFormData>): Promise<Reservation> => {
  const response = await axiosInstance.patch(`/reservations/${id}/`, data);
  return response.data;
};

export const updateReservationStatus = async (id: number, statut: Reservation['statut']): Promise<Reservation> => {
  const response = await axiosInstance.patch(`/reservations/${id}/`, { statut });
  return response.data;
};

export const deleteReservation = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/reservations/${id}/`);
};
