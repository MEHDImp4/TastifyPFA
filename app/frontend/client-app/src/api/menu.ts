import { api as axiosInstance } from './axios';
import { resolveMediaUrl } from './apiConfig';
import type { PaginatedResponse, PaginationParams } from './pagination';
import { mapPaginatedData, toPaginatedResponse } from './pagination';

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
  note?: number | null;
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

const withCategoryMedia = (category: Categorie): Categorie => ({
  ...category,
  image: resolveMediaUrl(category.image),
});

const withPlatMedia = (plat: Plat): Plat => ({
  ...plat,
  image: resolveMediaUrl(plat.image),
});

export const menuApi = {
  getCategories: () => axiosInstance.get<Categorie[]>('/categories/').then(res => ({
    ...res,
    data: res.data.map(withCategoryMedia),
  })),
  getPlats: () => axiosInstance.get<Plat[]>('/plats/').then(res => ({
    ...res,
    data: res.data.map(withPlatMedia),
  })),
  getPlatsPage: (params: PaginationParams) => axiosInstance
    .get<PaginatedResponse<Plat> | Plat[]>('/plats/', { params })
    .then(res => ({
      ...res,
      data: toPaginatedResponse(mapPaginatedData(res.data, withPlatMedia)),
    })),
  getPlat: (id: number) => axiosInstance.get<Plat>(`/plats/${id}/`).then(res => ({
    ...res,
    data: withPlatMedia(res.data),
  })),
  getRecommendations: (id: number) => axiosInstance.get<Plat[]>(`/plats/${id}/recommendations/`).then(res => ({
    ...res,
    data: res.data.map(withPlatMedia),
  })),
  getTopRecommendations: () => axiosInstance.get<Plat[]>('/plats/top-recommendations/').then(res => ({
    ...res,
    data: res.data.map(withPlatMedia),
  })),
};
