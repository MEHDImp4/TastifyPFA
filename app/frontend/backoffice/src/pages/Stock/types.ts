export interface Ingredient {
  id: number;
  nom: string;
  unite_mesure: 'g' | 'ml' | 'pcs';
  stock_actuel: number;
  seuil_alerte: number;
  est_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatIngredient {
  id: number;
  plat: number;
  ingredient: number;
  quantite_requise: number;
}
