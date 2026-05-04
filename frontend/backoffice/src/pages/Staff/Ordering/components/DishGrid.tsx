import { motion } from 'framer-motion'
import { MenuDish } from '../types'
import { DishCard } from './DishCard'

interface DishGridProps {
  tableId: number
  dishes: MenuDish[]
  selectedCategoryId: number | null
}

export const DishGrid = ({ tableId, dishes, selectedCategoryId }: DishGridProps) => {
  const filteredDishes = dishes.filter((dish) => (
    dish.est_disponible !== false && (selectedCategoryId === null || dish.categorie === selectedCategoryId)
  ))

  if (filteredDishes.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-surface p-8 text-center text-foreground-muted">
        Aucun plat disponible.
      </div>
    )
  }

  return (
    <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filteredDishes.map((dish) => (
        <motion.div key={dish.id} layout>
          <DishCard tableId={tableId} dish={dish} />
        </motion.div>
      ))}
    </motion.div>
  )
}
