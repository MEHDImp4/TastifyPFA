import { api } from './axios';

export interface Categorie {
  id: number;
  nom: string;
  description: string;
  image: string | null;
  ordre_affichage: number;
}

export interface Plat {
  id: number;
  categorie: number;
  nom: string;
  description: string;
  prix: string;
  image: string | null;
  temps_preparation: number;
}

export const menuApi = {
  getCategories: () => api.get<Categorie[]>('/categories/'),
  getPlats: (params?: any) => api.get<Plat[]>('/plats/', { params }),
  getTopRecommendations: () => api.get<Plat[]>('/plats/top-recommendations/'),
};
