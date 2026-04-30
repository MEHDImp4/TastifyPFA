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
    <article className="overflow-hidden rounded-lg border border-white/10 bg-[#264653] transition-[transform,border-color] duration-200 active:scale-[0.97]">
      <div className="aspect-[4/3] bg-white/5">
        {dish.image ? (
          <img src={normalizeMediaUrl(dish.image)} alt={dish.nom} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-bold text-foreground-muted">
            Tastify
          </div>
        )}
      </div>

      <div className="space-y-4 p-4">
        <div>
          <h3 className="line-clamp-2 min-h-12 text-base font-bold text-white">{dish.nom}</h3>
          {dish.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-foreground-muted">{dish.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="font-bold tabular-nums text-amber">{formatPrice(dish.prix)}</span>

          <div className="flex min-h-11 items-center overflow-hidden rounded-lg border border-white/10">
            <button
              type="button"
              aria-label={`Retirer ${dish.nom}`}
              className="flex min-h-11 min-w-11 items-center justify-center bg-[#E76F51]/20 text-[#E76F51] transition-[background-color,transform] duration-200 hover:bg-[#E76F51]/30 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={quantity === 0}
              onClick={() => removeItem(tableId, dish.id)}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-11 text-center text-sm font-bold tabular-nums text-white">{quantity}</span>
            <button
              type="button"
              aria-label={`Ajouter ${dish.nom}`}
              className="flex min-h-11 min-w-11 items-center justify-center bg-[#2A9D8F] text-white transition-[background-color,transform] duration-200 hover:bg-[#2A9D8F]/90 active:scale-[0.97]"
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
