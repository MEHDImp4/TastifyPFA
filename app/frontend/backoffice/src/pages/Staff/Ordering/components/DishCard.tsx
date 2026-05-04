import { Minus, Plus } from 'lucide-react'
import { MenuDish } from '../types'
import { useOrderStore } from '../store/useOrderStore'
import { normalizeMediaUrl } from '@shared/media/mediaUrl'

interface DishCardProps {
  tableId: number
  dish: MenuDish
}

const formatPrice = (price: string | number) => `${Number(price).toFixed(2)} DH`

export const DishCard = ({ tableId, dish }: DishCardProps) => {
  const addItem = useOrderStore((state) => state.addItem)
  const removeItem = useOrderStore((state) => state.removeItem)
  const quantity = useOrderStore((state) => (
    state.carts[tableId]?.find((item) => item.plat.id === dish.id)?.quantity ?? 0
  ))

  return (
    <article className="group overflow-hidden rounded-xl border border-white/5 bg-surface transition-[transform,border-color] duration-200 active:scale-[0.98] hover:border-white/10 shadow-sm">
      <div className="aspect-[16/9] sm:aspect-[4/3] bg-white/[0.03] relative overflow-hidden">
        {dish.image ? (
          <img 
            src={normalizeMediaUrl(dish.image)} 
            alt={dish.nom} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] font-black uppercase tracking-widest text-foreground-muted/30">
            Tastify
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="rounded-full bg-black/60 backdrop-blur-md px-2 py-1 text-[10px] font-black text-white border border-white/10 tabular-nums">
            {formatPrice(dish.prix)}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-3 sm:p-4">
        <div>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm sm:text-base font-bold text-white tracking-tight leading-snug">
            {dish.nom}
          </h3>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex flex-1 items-center justify-between overflow-hidden rounded-lg bg-white/5 border border-white/5">
            <button
              type="button"
              aria-label={`Retirer ${dish.nom}`}
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center text-[#E76F51] transition-all duration-200 hover:bg-[#E76F51]/10 active:scale-[0.9] disabled:opacity-20 disabled:scale-100"
              disabled={quantity === 0}
              onClick={() => removeItem(tableId, dish.id)}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-xs sm:text-sm font-black tabular-nums text-white min-w-[1.5rem] text-center">
              {quantity || '0'}
            </span>
            <button
              type="button"
              aria-label={`Ajouter ${dish.nom}`}
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center text-teal transition-all duration-200 hover:bg-teal/10 active:scale-[0.9]"
              onClick={() => addItem(tableId, dish)}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
