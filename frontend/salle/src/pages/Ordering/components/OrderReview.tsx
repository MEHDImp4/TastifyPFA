import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { CartItem } from '../store/useOrderStore'

interface OrderReviewProps {
  isOpen: boolean
  items: CartItem[]
  total: number
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: () => void
}

export const OrderReview = ({
  isOpen,
  items,
  total,
  isSubmitting = false,
  onClose,
  onSubmit,
}: OrderReviewProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm">
      <button type="button" aria-label="Fermer la revue" className="absolute inset-0 cursor-default" onClick={onClose} />
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="relative max-h-[86vh] w-full overflow-y-auto rounded-t-lg border border-white/10 bg-[#264653] p-5 shadow-2xl sm:mx-auto sm:max-w-2xl"
      >
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal">Validation</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Revue de commande</h2>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/10 text-foreground-muted transition-[color,transform] duration-200 hover:text-white active:scale-[0.97]"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={item.plat.id} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
              <div>
                <p className="font-bold text-white">{item.plat.nom}</p>
                <p className="text-sm text-foreground-muted">
                  {item.quantity} x {Number(item.plat.prix).toFixed(2)} DH
                </p>
              </div>
              <p className="font-bold tabular-nums text-amber">
                {(Number(item.plat.prix) * item.quantity).toFixed(2)} DH
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
          <span className="text-sm font-bold uppercase tracking-wider text-foreground-muted">Total</span>
          <span className="text-2xl font-bold tabular-nums text-white">{total.toFixed(2)} DH</span>
        </div>

        <button
          type="button"
          disabled={items.length === 0 || isSubmitting}
          onClick={onSubmit}
          className="mt-6 min-h-12 w-full rounded-lg bg-[#2A9D8F] px-5 font-bold text-white transition-[background-color,transform] duration-200 hover:bg-[#2A9D8F]/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Envoi en cours...' : 'Confirmer la commande'}
        </button>
      </motion.section>
    </div>
  )
}
