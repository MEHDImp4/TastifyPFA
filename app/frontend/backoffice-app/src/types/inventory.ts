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
  username?: string;
  poste: string;
  salaire: string;
  date_embauche: string;
  telephone: string;
  cin: string;
}
