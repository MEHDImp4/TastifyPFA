export interface Category {
  id: number;
  nom: string;
  image?: string;
  est_active: boolean;
}

export interface Plat {
  id: number;
  nom: string;
  description: string;
  prix: number;
  image: string;
  categorie: number;
  categorie_detail: Category;
  est_disponible: boolean;
  est_active: boolean;
}

export interface PlatsPageState {
  categories: Category[];
  plats: Plat[];
  selectedCategoryId: number | 'all';
  loading: boolean;
  error: string | null;
}
