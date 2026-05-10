import { api } from './axios';

export interface Ingredient {
  id: number;
  nom: string;
  unite_mesure: 'g' | 'ml' | 'pcs';
  stock_actuel: string;
  seuil_alerte: string;
  est_active: boolean;
}

export const stockApi = {
  getIngredients: () => api.get<Ingredient[]>('/stock/ingredients/'),
  createIngredient: (data: Partial<Ingredient>) => api.post<Ingredient>('/stock/ingredients/', data),
  updateIngredient: (id: number, data: Partial<Ingredient>) => api.patch<Ingredient>(`/stock/ingredients/${id}/`, data),
  deleteIngredient: (id: number) => api.delete(`/stock/ingredients/${id}/`),
};

export interface Employe {
  id: number;
  user: number;
  username?: string;
  poste: string;
  salaire: string;
  date_embauche: string;
  telephone: string;
  cin: string;
}

export const hrApi = {
  getEmployes: () => api.get<Employe[]>('/employes/'),
  createEmploye: (data: any) => api.post<Employe>('/employes/', data),
  updateEmploye: (id: number, data: any) => api.patch<Employe>(`/employes/${id}/`, data),
  deleteEmploye: (id: number) => api.delete(`/employes/${id}/`),
};
