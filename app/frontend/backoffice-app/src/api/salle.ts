import { api } from './axios';
import type { Table, Commande, PlanText } from '../types/salle';

export const salleApi = {
  getTables: () => api.get<Table[]>('/tables/'),
  updateTablePos: (id: number, pos: { pos_x: number; pos_y: number }) => api.patch<Table>(`/tables/${id}/`, pos),
  createTable: (data: Partial<Table>) => api.post<Table>('/tables/', data),
  updateTable: (id: number, data: Partial<Table>) => api.patch<Table>(`/tables/${id}/`, data),
  deleteTable: (id: number) => api.delete(`/tables/${id}/`),
  
  getPlanTexts: () => api.get<PlanText[]>('/plan-texts/'),
  updatePlanTextPos: (id: number, pos: { pos_x: number; pos_y: number }) => api.patch<PlanText>(`/plan-texts/${id}/`, pos),
  createPlanText: (data: Partial<PlanText>) => api.post<PlanText>('/plan-texts/', data),
  updatePlanText: (id: number, data: Partial<PlanText>) => api.patch<PlanText>(`/plan-texts/${id}/`, data),
  deletePlanText: (id: number) => api.delete(`/plan-texts/${id}/`),

  getCommandes: (params?: any) => api.get<Commande[]>('/commandes/', { params }),
  getCommandeByTable: (tableId: number) => api.get<Commande[]>(`/commandes/?table=${tableId}&statut=EN_COURS,EN_CUISINE,PRETE`),
  createCommande: (data: Partial<Commande>) => api.post<Commande>('/commandes/', data),
  addItemsToCommande: (id: number, items: any[]) => api.post(`/commandes/${id}/add_items/`, { lignes: items }),
  updateCommandeStatut: (id: number, statut: string) => api.patch(`/commandes/${id}/`, { statut }),

  // Payment methods
  createManualPayment: (data: { commande: number, montant: string, methode: 'ESPECES' | 'CARTE' }) =>
    api.post('/paiements/', data),
  getPaymentQr: (tableId: number) => 
    api.get<{ token: string, payment_url: string }>(`/tables/${tableId}/qr/`),
  };

