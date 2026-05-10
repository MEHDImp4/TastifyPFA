export interface Table {
  id: number;
  numero: number;
  capacite: number;
  statut: 'LIBRE' | 'OCCUPEE' | 'RESERVEE' | 'ENCAISSEMENT';
  pos_x: number;
  pos_y: number;
  est_active: boolean;
}

export interface CommandeLigne {
  id?: number;
  plat: number;
  plat_nom?: string;
  quantite: number;
  prix_unitaire: string;
  statut: 'EN_ATTENTE' | 'EN_PREPARATION' | 'PRET' | 'SERVI' | 'ANNULE';
  notes: string;
}

export interface Commande {
  id: number;
  table: number | null;
  serveur: number | null;
  type: 'SUR_PLACE' | 'EMPORTER';
  client_nom: string | null;
  statut: 'EN_COURS' | 'EN_CUISINE' | 'PRETE' | 'PAYEE' | 'ANNULEE';
  montant_total: string;
  lignes: CommandeLigne[];
  created_at: string;
}
