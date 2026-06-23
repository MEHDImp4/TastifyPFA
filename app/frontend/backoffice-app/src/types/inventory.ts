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
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_active?: boolean;
}

export interface Shift {
  id: number;
  employe: number;
  employe_name?: string;
  jour: string;
  heure_debut: string;
  heure_fin: string;
  notes: string;
  created_at: string;
}

export interface OffreEmploi {
  id: number;
  titre: string;
  description: string;
  type_contrat: 'CDI' | 'CDD' | 'SAISONNIER';
  salaire_propose: string;
  est_publiee: boolean;
  created_at: string;
  candidatures_count?: number;
}

export interface Candidature {
  id: number;
  offre: number;
  offre_titre?: string;
  nom_complet: string;
  email: string;
  telephone: string;
  message_motivation: string;
  cv_url: string;
  statut: 'NOUVELLE' | 'ENTRETENUE' | 'REFUSEE' | 'RECRUTEE';
  created_at: string;
}

