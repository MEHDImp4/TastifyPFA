import { api as axiosInstance } from './axios';

export interface Categorie {
  id: number;
  nom: string;
  description: string | null;
  ordre_affichage: number;
  image: string | null;
  est_active: boolean;
}

export interface Avis {
  id: number;
  user_username: string;
  commentaire: string;
  note: number;
  sentiment_score: number | null;
  created_at: string;
}

export interface Plat {
  id: number;
  categorie: number;
  nom: string;
  description: string | null;
  prix: string;
  temps_preparation: number;
  image: string | null;
  est_disponible: boolean;
  est_active: boolean;
  sentiment_score: number | null;
  top_avis?: Avis[];
}

export const menuApi = {
  getCategories: () => axiosInstance.get<Categorie[]>('/categories/'),
  getPlats: () => axiosInstance.get<Plat[]>('/plats/'),
  getPlat: (id: number) => axiosInstance.get<Plat>(`/plats/${id}/`),
  getRecommendations: (id: number) => axiosInstance.get<Plat[]>(`/plats/${id}/recommendations/`),
  getTopRecommendations: () => axiosInstance.get<Plat[]>('/plats/top-recommendations/'),
};
