export interface UserDetails {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'GERANT' | 'SERVEUR' | 'CUISINIER' | 'CLIENT';
  is_active: boolean;
}

export interface Employe {
  id: number;
  user: number;
  user_details: UserDetails;
  poste: string;
  salaire: string;
  date_embauche: string;
  telephone: string;
  adresse: string;
  cin: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeFormData {
  username?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  poste: string;
  salaire: number | string;
  date_embauche: string;
  telephone?: string;
  adresse?: string;
  cin?: string;
}
