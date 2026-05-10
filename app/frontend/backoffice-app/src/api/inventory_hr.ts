import { api } from './axios';
import type { Ingredient, Employe } from '../types/inventory';

export const stockApi = {
  getIngredients: () => api.get<Ingredient[]>('/stock/ingredients/'),
  createIngredient: (data: Partial<Ingredient>) => api.post<Ingredient>('/stock/ingredients/', data),
  updateIngredient: (id: number, data: Partial<Ingredient>) => api.patch<Ingredient>(`/stock/ingredients/${id}/`, data),
  deleteIngredient: (id: number) => api.delete(`/stock/ingredients/${id}/`),
};

export const hrApi = {
  getEmployes: () => api.get<Employe[]>('/employes/'),
  createEmploye: (data: any) => api.post<Employe>('/employes/', data),
  updateEmploye: (id: number, data: any) => api.patch<Employe>(`/employes/${id}/`, data),
  deleteEmploye: (id: number) => api.delete(`/employes/${id}/`),
};
