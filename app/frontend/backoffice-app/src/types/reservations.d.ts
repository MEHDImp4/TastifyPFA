export interface Reservation {
  id: number;
  table: number;
  table_numero?: string;
  user_username?: string;
  date_reservation: string;
  heure_debut: string;
  heure_fin: string;
  nombre_personnes: number;
  notes?: string;
  statut: 'EN_ATTENTE' | 'CONFIRMEE' | 'ANNULEE' | 'TERMINEE';
}
