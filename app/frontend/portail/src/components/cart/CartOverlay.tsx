import React, { useState } from 'react'
import { X, Minus, Plus, Trash2, ShoppingBag, Loader2, ArrowRight } from 'lucide-react'
import { useCartStore } from '../../store/useCartStore'
import { useAuthStore } from '@shared/auth/useAuthStore'
import axiosInstance from '@shared/auth/axiosInstance'
import { useNavigate } from 'react-router-dom'

interface CartOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export const CartOverlay: React.FC<CartOverlayProps> = ({ isOpen, onClose }) => {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  const { isAuthenticated, user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderType, setOrderType] = useState<'SUR_PLACE' | 'EMPORTER'>('EMPORTER')
  const [clientNom, setClientNom] = useState(user?.username || '')
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleCheckout = async () => {
    if (items.length === 0) return

    if (!isAuthenticated || user?.role !== 'CLIENT') {
      alert("Connectez-vous avec un compte client pour valider une commande a emporter.")
      onClose()
      navigate('/login')
      return
    }

    setIsSubmitting(true)

    try {
      // Create the order
      const response = await axiosInstance.post('/commandes/', {
        type: orderType,
        client_nom: clientNom,
        lignes: items.map(item => ({
          plat: item.platId,
          quantite: item.quantity,
          notes: item.notes
        }))
      })

      // Send to kitchen
      await axiosInstance.patch(`/commandes/${response.data.id}/`, { statut: 'EN_CUISINE' })

      clearCart()
      onClose()
      alert("Commande envoyée avec succès ! Vous pouvez la retirer bientôt.")
      navigate('/')
    } catch (err: any) {
      console.error("Checkout failed", err)
      alert(err.response?.data?.error || "Une erreur est survenue lors de la commande.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end outline-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-surface shadow-2xl animate-slide-in-right">
        <header className="flex items-center justify-between border-b border-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10 border border-teal/20 text-teal">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Votre Panier</h2>
              <p className="text-xs text-foreground-muted uppercase tracking-widest font-bold mt-1">
                {items.length} article{items.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-foreground-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 [scrollbar-width:thin]">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center opacity-40">
              <ShoppingBag size={48} />
              <p className="text-sm font-medium">Votre panier est vide.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="group relative flex gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{item.nom}</h3>
                  <p className="mt-1 text-xs font-black text-teal">{item.prix} MAD</p>
                  
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-foreground-muted hover:text-white transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-xs font-bold text-white">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-foreground-muted hover:text-white transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-bold text-error/60 hover:text-error transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      Retirer
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-white/10 bg-white/[0.02] p-6 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOrderType('EMPORTER')}
                  className={`flex flex-col gap-1 rounded-xl border p-3 text-left transition-all ${orderType === 'EMPORTER' ? 'border-teal bg-teal/10 ring-1 ring-teal/20' : 'border-white/5 bg-white/5'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-teal">Retrait</span>
                  <span className="text-xs font-bold text-white">À emporter</span>
                </button>
                <button
                  onClick={() => setOrderType('SUR_PLACE')}
                  className={`flex flex-col gap-1 rounded-xl border p-3 text-left transition-all opacity-50 cursor-not-allowed ${orderType === 'SUR_PLACE' ? 'border-teal bg-teal/10 ring-1 ring-teal/20' : 'border-white/5 bg-white/5'}`}
                  title="Disponible uniquement en salle via nos serveurs"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service</span>
                  <span className="text-xs font-bold text-slate-400">Sur place</span>
                </button>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted">Nom pour le retrait</span>
                <input
                  type="text"
                  value={clientNom}
                  onChange={(e) => setClientNom(e.target.value)}
                  placeholder="Votre nom"
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-teal/50 transition-colors"
                />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground-muted">Total</span>
              <span className="text-2xl font-black text-white">{getTotal().toFixed(2)} MAD</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting || !clientNom}
              className="group relative w-full overflow-hidden rounded-2xl bg-teal px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-teal/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <span>Commander & Payer</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>
          </footer>
        )}
      </aside>
    </div>
  )
}
