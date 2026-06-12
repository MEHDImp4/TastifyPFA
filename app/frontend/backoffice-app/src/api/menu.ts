import { api } from './axios';
import type { Categorie, Plat } from '../types/menu';
import { resolveMediaUrl } from './apiConfig';

const withCategoryMedia = (category: Categorie): Categorie => ({
  ...category,
  image: resolveMediaUrl(category.image),
});

const withPlatMedia = (plat: Plat): Plat => ({
  ...plat,
  image: resolveMediaUrl(plat.image),
});

export const menuApi = {
  // Categories
  getCategories: () => api.get<Categorie[]>('/categories/').then(res => ({
    ...res,
    data: res.data.map(withCategoryMedia),
  })),
  createCategory: (data: FormData) => api.post<Categorie>('/categories/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => ({ ...res, data: withCategoryMedia(res.data) })),
  updateCategory: (id: number, data: FormData) => api.patch<Categorie>(`/categories/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => ({ ...res, data: withCategoryMedia(res.data) })),
  deleteCategory: (id: number) => api.delete(`/categories/${id}/`),

  // Plats
  getPlats: () => api.get<Plat[]>('/plats/').then(res => ({
    ...res,
    data: res.data.map(withPlatMedia),
  })),
  createPlat: (data: FormData) => api.post<Plat>('/plats/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => ({ ...res, data: withPlatMedia(res.data) })),
  updatePlat: (id: number, data: FormData) => api.patch<Plat>(`/plats/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => ({ ...res, data: withPlatMedia(res.data) })),
  deletePlat: (id: number) => api.delete(`/plats/${id}/`),
};
