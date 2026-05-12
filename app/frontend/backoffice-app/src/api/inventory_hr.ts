import { api } from './axios';
import type { Ingredient, Employe, PlatIngredient } from '../types/inventory';

export const stockApi = {
  getIngredients: () => api.get<Ingredient[]>('/stock/ingredients/'),
  createIngredient: (data: Partial<Ingredient>) => api.post<Ingredient>('/stock/ingredients/', data),
  updateIngredient: (id: number, data: Partial<Ingredient>) => api.patch<Ingredient>(`/stock/ingredients/${id}/`, data),
  deleteIngredient: (id: number) => api.delete(`/stock/ingredients/${id}/`),

  getPlatIngredients: () => api.get<PlatIngredient[]>('/stock/plat-ingredients/'),
  createPlatIngredient: (data: Partial<PlatIngredient>) => api.post<PlatIngredient>('/stock/plat-ingredients/', data),
  updatePlatIngredient: (id: number, data: Partial<PlatIngredient>) => api.patch<PlatIngredient>(`/stock/plat-ingredients/${id}/`, data),
  deletePlatIngredient: (id: number) => api.delete(`/stock/plat-ingredients/${id}/`),
};

export const hrApi = {
  getEmployes: () => api.get<Employe[]>('/employes/'),
  createEmploye: (data: any) => api.post<Employe>('/employes/', data),
  updateEmploye: (id: number, data: any) => api.patch<Employe>(`/employes/${id}/`, data),
  deleteEmploye: (id: number) => api.delete(`/employes/${id}/`),
};
