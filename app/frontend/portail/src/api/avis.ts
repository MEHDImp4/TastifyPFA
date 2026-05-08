import axiosInstance from '@shared/auth/axiosInstance';
import publicClient from '@shared/auth/publicClient';

export interface Avis {
  id: number;
  user: number;
  plat?: number;
  commande?: number;
  commentaire: string;
  note: number;
  sentiment_score?: number;
  created_at: string;
}

export interface CreateAvisPayload {
  plat?: number;
  commande?: number;
  commentaire: string;
  note: number;
}

/**
 * Submit a review.
 * Note: This usually requires authentication in the backend.
 * If the user is authenticated, use axiosInstance.
 * If not, and the backend allows anonymous reviews (unlikely given the model), use publicClient.
 */
export const createAvis = async (payload: CreateAvisPayload): Promise<Avis> => {
  const response = await axiosInstance.post('/avis/', payload);
  return response.data;
};

/**
 * Fetch reviews for a specific dish.
 */
export const fetchAvisByPlat = async (platId: number): Promise<Avis[]> => {
  const response = await publicClient.get('/avis/', { params: { plat: platId } });
  return response.data;
};

/**
 * Fetch all reviews (for back-office).
 */
export const fetchAllAvis = async (): Promise<Avis[]> => {
  const response = await axiosInstance.get('/avis/');
  return response.data;
};
