import axiosInstance from '@shared/auth/axiosInstance';

export interface Avis {
  id: number;
  user: number;
  username: string;
  plat?: number;
  commande?: number;
  commentaire: string;
  note: number;
  sentiment_score?: number;
  created_at: string;
}

export const fetchAllAvis = async (): Promise<Avis[]> => {
  const response = await axiosInstance.get('/avis/');
  return response.data;
};
