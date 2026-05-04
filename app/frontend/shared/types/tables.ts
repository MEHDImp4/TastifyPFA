export type TableStatus = 'LIBRE' | 'OCCUPEE' | 'RESERVEE' | 'ENCAISSEMENT';

export interface Table {
  id: number;
  numero: number;
  capacite: number;
  statut: TableStatus;
  pos_x: number;
  pos_y: number;
  est_active: boolean;
  created_at: string;
  updated_at: string;
}
