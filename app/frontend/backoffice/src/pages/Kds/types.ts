export type CommandeStatut = 'EN_COURS' | 'EN_CUISINE' | 'PRETE' | 'PAYEE' | 'ANNULEE'
export type CommandeLigneStatut = 'EN_ATTENTE' | 'EN_PREPARATION' | 'PRET' | 'SERVI' | 'ANNULE'

export interface PlatDetails {
  id: number
  nom: string
  prix: string | number
}

export interface CommandeLigne {
  id: number
  plat: number
  plat_details: PlatDetails
  quantite: number
  prix_unitaire: string | number
  statut: CommandeLigneStatut
  notes: string
  heure_lancement: string | null
  heure_fin_estimee: string | null
  created_at: string
  updated_at: string
}

export interface Commande {
  id: number
  table: number | null
  type: 'SUR_PLACE' | 'EMPORTER'
  client_nom?: string | null
  serveur: number | null
  serveur_name: string | null
  serveur_username: string | null
  statut: CommandeStatut
  montant_total: string | number
  est_active: boolean
  created_at: string
  updated_at: string
  lignes: CommandeLigne[]
}
