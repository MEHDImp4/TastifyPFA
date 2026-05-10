import { api } from './axios';
import { Categorie, Plat } from '../types/menu';

export const menuApi = {
  // Categories
  getCategories: () => api.get<Categorie[]>('/categories/'),
  createCategory: (data: FormData) => api.post<Categorie>('/categories/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateCategory: (id: number, data: FormData) => api.patch<Categorie>(`/categories/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteCategory: (id: number) => api.delete(`/categories/${id}/`),

  // Plats
  getPlats: () => api.get<Plat[]>('/plats/'),
  createPlat: (data: FormData) => api.post<Plat>('/plats/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updatePlat: (id: number, data: FormData) => api.patch<Plat>(`/plats/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deletePlat: (id: number) => api.delete(`/plats/${id}/`),
};
