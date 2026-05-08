import axiosInstance from '@shared/auth/axiosInstance';

export interface Plat {
  id: number;
  nom: string;
  description: string;
  prix: string;
  image: string | null;
  categorie: number;
}

export const fetchPlats = async (): Promise<Plat[]> => {
  const response = await axiosInstance.get('/api/menu/plats/');
  return response.data;
};

export const fetchRecommendations = async (platId: number): Promise<Plat[]> => {
  const response = await axiosInstance.get(`/api/menu/plats/${platId}/recommendations/`);
  return response.data;
};
