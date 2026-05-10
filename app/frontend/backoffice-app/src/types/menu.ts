export interface Categorie {
  id: number;
  nom: string;
  description: string;
  ordre_affichage: number;
  image: string | null;
  est_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Plat {
  id: number;
  categorie: number;
  nom: string;
  description: string;
  prix: string;
  temps_preparation: number;
  image: string | null;
  est_disponible: boolean;
  est_active: boolean;
  created_at: string;
  updated_at: string;
}
