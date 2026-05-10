import { api } from './axios';
import { Commande } from '../types/salle';

export const kdsApi = {
  getActiveTickets: () => api.get<Commande[]>('/commandes/?statut=EN_CUISINE,PRETE'),
  updateItemStatut: (ligneId: number, statut: string) => api.patch(`/commandelignes/${ligneId}/`, { statut }),
  updateCommandeStatut: (id: number, statut: string) => api.patch(`/commandes/${id}/`, { statut }),
};
