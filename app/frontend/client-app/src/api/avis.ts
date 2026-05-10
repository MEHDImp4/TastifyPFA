import { api } from './axios';

export interface Avis {
  id?: number;
  plat?: number;
  commande?: number;
  commentaire: string;
  note: number;
  sentiment_score?: number;
  created_at?: string;
}

export const avisApi = {
  getAvis: () => api.get<Avis[]>('/avis/'),
  createAvis: (data: Avis) => api.post<Avis>('/avis/', data),
};
