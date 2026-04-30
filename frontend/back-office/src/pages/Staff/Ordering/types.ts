export interface MenuCategory {
  id: number
  nom: string
  description?: string
  ordre_affichage?: number
  image?: string | null
  est_active?: boolean
}

export interface MenuDish {
  id: number
  categorie: number
  nom: string
  description?: string
  prix: string | number
  temps_preparation?: number
  image?: string | null
  est_disponible?: boolean
  est_active?: boolean
}
