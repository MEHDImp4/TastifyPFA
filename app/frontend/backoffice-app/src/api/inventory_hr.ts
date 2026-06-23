import { api } from './axios';
import type { Ingredient, Employe, PlatIngredient, Shift, OffreEmploi, Candidature } from '../types/inventory';
import type { PaginatedResponse, PaginationParams } from './pagination';
import { toPaginatedResponse } from './pagination';

export const stockApi = {
  getIngredients: (params?: Pick<PaginationParams, 'search' | 'est_active'>) => api.get<Ingredient[]>('/stock/ingredients/', { params }),
  getIngredientsPage: (params: PaginationParams) => api
    .get<PaginatedResponse<Ingredient> | Ingredient[]>('/stock/ingredients/', { params })
    .then(res => ({ ...res, data: toPaginatedResponse(res.data) })),
  createIngredient: (data: Partial<Ingredient>) => api.post<Ingredient>('/stock/ingredients/', data),
  updateIngredient: (id: number, data: Partial<Ingredient>) => api.patch<Ingredient>(`/stock/ingredients/${id}/`, data),
  deleteIngredient: (id: number) => api.delete(`/stock/ingredients/${id}/`),

  getPlatIngredients: (params?: { plat?: number }) => api.get<PlatIngredient[]>('/stock/plat-ingredients/', { params }),
  createPlatIngredient: (data: Partial<PlatIngredient>) => api.post<PlatIngredient>('/stock/plat-ingredients/', data),
  updatePlatIngredient: (id: number, data: Partial<PlatIngredient>) => api.patch<PlatIngredient>(`/stock/plat-ingredients/${id}/`, data),
  deletePlatIngredient: (id: number) => api.delete(`/stock/plat-ingredients/${id}/`),

  createMouvement: (data: { ingredient: number, quantite: string, type_mouvement: 'ENTREE' | 'SORTIE', source: string, commentaire?: string }) => 
    api.post('/stock/mouvements/', data),
};

export const hrApi = {
  getEmployes: (params?: Pick<PaginationParams, 'search' | 'poste'>) => api.get<Employe[]>('/employes/', { params }),
  getEmployesPage: (params: PaginationParams) => api
    .get<PaginatedResponse<Employe> | Employe[]>('/employes/', { params })
    .then(res => ({ ...res, data: toPaginatedResponse(res.data) })),
  createEmploye: (data: any) => api.post<Employe>('/employes/', data),
  updateEmploye: (id: number, data: any) => api.patch<Employe>(`/employes/${id}/`, data),
  deleteEmploye: (id: number) => api.delete(`/employes/${id}/`),

  getShifts: (params?: { employe?: number; jour?: string }) => api.get<Shift[]>('/shifts/', { params }),
  createShift: (data: Partial<Shift>) => api.post<Shift>('/shifts/', data),
  deleteShift: (id: number) => api.delete(`/shifts/${id}/`),

  getOffres: (params?: PaginationParams) => api
    .get<PaginatedResponse<OffreEmploi> | OffreEmploi[]>('/offres/', { params })
    .then(res => ({ ...res, data: toPaginatedResponse(res.data) })),
  createOffre: (data: Partial<OffreEmploi>) => api.post<OffreEmploi>('/offres/', data),
  updateOffre: (id: number, data: Partial<OffreEmploi>) => api.patch<OffreEmploi>(`/offres/${id}/`, data),
  deleteOffre: (id: number) => api.delete(`/offres/${id}/`),

  getCandidatures: (params?: { offre?: number }) => api.get<Candidature[]>('/candidatures/', { params }),
  updateCandidatureStatus: (id: number, statut: string) => api.patch<Candidature>(`/candidatures/${id}/`, { statut }),
};
