export type TableStatus = 'LIBRE' | 'OCCUPEE' | 'RESERVEE' | 'ENCAISSEMENT';

export interface Table {
  id: number;
  numero: number;
  capacite: number;
  statut: TableStatus;
  statut_effectif?: TableStatus;
  has_payable_order?: boolean;
  prochaine_reservation?: {
    id: number;
    heure_debut: string;
    heure_fin: string;
    client_name: string;
    statut: string;
    nombre_personnes: number;
    is_current: boolean;
  } | null;
  pos_x: number;
  pos_y: number;
  est_active: boolean;
  est_disponible?: boolean;
  created_at: string;
  updated_at: string;
}
