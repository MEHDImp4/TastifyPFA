import { api } from './axios';
import type { PaginatedResponse, PaginationParams } from './pagination';
import { toPaginatedResponse } from './pagination';

export interface Avis {
  id: number;
  user: number;
  username?: string;
  user_username?: string;
  plat?: number | null;
  commande?: number | null;
  commentaire: string;
  note: number | null;
  sentiment_score: number | null;
  lang_code: string | null;
  created_at: string;
  updated_at: string;
}

export const avisApi = {
  getAvis: () => api.get<Avis[]>('/avis/'),
  getAvisPage: (params: PaginationParams) => api
    .get<PaginatedResponse<Avis> | Avis[]>('/avis/', { params })
    .then(res => ({ ...res, data: toPaginatedResponse(res.data) })),
};
