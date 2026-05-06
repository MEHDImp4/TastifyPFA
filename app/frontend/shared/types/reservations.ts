export interface ClientDetails {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface TableDetails {
  id: number;
  numero: number;
  capacite: number;
}

export interface Reservation {
  id: number;
  client: number;
  client_details?: ClientDetails;
  table: number;
  table_details?: TableDetails;
  date_reservation: string;
  heure_debut: string;
  heure_fin: string;
  nombre_personnes: number;
  statut: 'CONFIRMEE' | 'ANNULEE' | 'PRESENTE' | 'ABSENTE';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ReservationFormData {
  client?: number;
  table: number | '';
  date_reservation: string;
  heure_debut: string;
  heure_fin: string;
  nombre_personnes: number;
  statut: 'CONFIRMEE' | 'ANNULEE' | 'PRESENTE' | 'ABSENTE';
  notes?: string;
}
