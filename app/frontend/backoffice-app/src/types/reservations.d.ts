export interface Reservation {
  id: number;
  table: number;
  table_details?: {
    id: number;
    numero: string | number;
    capacite: number;
  } | null;
  table_numero?: string;
  client_details?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  } | null;
  user_username?: string;
  date_reservation: string;
  heure_debut: string;
  heure_fin: string;
  nombre_personnes: number;
  notes?: string;
  statut: 'EN_ATTENTE' | 'CONFIRMEE' | 'ANNULEE' | 'TERMINEE';
}
