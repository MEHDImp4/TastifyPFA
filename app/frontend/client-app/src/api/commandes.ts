import { api } from './axios';

export interface CommandeLigne {
  id: number;
  plat_nom: string;
  quantite: number;
  prix_unitaire: string;
}

export interface Commande {
  id: number;
  statut: string;
  type: string;
  montant_total: string;
  created_at: string;
  lignes: CommandeLigne[];
}

export const commandesApi = {
  getMyOrders: () => api.get<Commande[]>('/commandes/'),
};
