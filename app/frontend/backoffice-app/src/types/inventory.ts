export interface Ingredient {
  id: number;
  nom: string;
  unite_mesure: 'g' | 'ml' | 'pcs';
  stock_actuel: string;
  seuil_alerte: string;
  est_active: boolean;
}

export interface PlatIngredient {
  id: number;
  plat: number;
  ingredient: number;
  quantite_requise: string;
}

export interface Employe {
  id: number;
  user: number;
  user_details?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_active: boolean;
  };
  poste: string;
  salaire: string;
  date_embauche: string;
  telephone: string;
  cin: string;
}
