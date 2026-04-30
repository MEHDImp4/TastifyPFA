import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import axiosInstance from '@shared/auth/axiosInstance'
import { CategoryTabs } from './components/CategoryTabs'
import { DishGrid } from './components/DishGrid'
import { FloatingCart } from './components/FloatingCart'
import { OrderReview } from './components/OrderReview'
import { useOrderStore } from './store/useOrderStore'
import { MenuCategory, MenuDish } from './types'

export const OrderingPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const tableId = Number(id)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [dishes, setDishes] = useState<MenuDish[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [activeOrder, setActiveOrder] = useState<any>(null)

  const getCart = useOrderStore((state) => state.getCart)
  const getCartTotal = useOrderStore((state) => state.getCartTotal)
  const getCartItemCount = useOrderStore((state) => state.getCartItemCount)
  const clearCart = useOrderStore((state) => state.clearCart)
  const carts = useOrderStore((state) => state.carts)

  const cartItems = useMemo(() => getCart(tableId), [carts, getCart, tableId])
  const cartTotal = useMemo(() => getCartTotal(tableId), [carts, getCartTotal, tableId])
  const cartItemCount = useMemo(() => getCartItemCount(tableId), [carts, getCartItemCount, tableId])

  useEffect(() => {
    if (!Number.isInteger(tableId) || tableId <= 0) {
      setError('Table introuvable.')
      setIsLoading(false)
      return
    }

    const fetchMenu = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [categoriesResponse, dishesResponse, ordersResponse] = await Promise.all([
          axiosInstance.get<MenuCategory[]>('/categories/'),
          axiosInstance.get<MenuDish[]>('/plats/'),
          axiosInstance.get<any[]>(`/commandes/?table=${tableId}&statut=EN_COURS`),
        ])

        setCategories(categoriesResponse.data)
        setDishes(dishesResponse.data)
        
        // If there's an active order, store it (taking the first one)
        if (ordersResponse.data.length > 0) {
          setActiveOrder(ordersResponse.data[0])
        }
      } catch (err) {
        console.error('Failed to load ordering menu', err)
        setError('Impossible de charger le menu.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenu()
  }, [tableId])

  const submitOrder = async () => {
    if (cartItems.length === 0) return

    setIsSubmitting(true)
    setError(null)

    try {
      if (activeOrder) {
        // We add items to existing order
        await axiosInstance.post(`/commandes/${activeOrder.id}/add_items/`, 
          cartItems.map((item) => ({
            plat: item.plat.id,
            quantite: item.quantity,
          }))
        )
      } else {
        // Create new order
        await axiosInstance.post('/commandes/', {
          table: tableId,
          lignes: cartItems.map((item) => ({
            plat: item.plat.id,
            quantite: item.quantity,
          })),
        })
      }

      clearCart(tableId)
      setIsReviewOpen(false)
      setSuccess(true)
      window.setTimeout(() => navigate('/'), 1500)
    } catch (err: any) {
      console.error('Failed to submit order', err)
      const message = err.response?.data?.table?.[0] || err.response?.data?.error || 'Commande non envoyée. Vérifiez la connexion puis réessayez.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-teal" />
        <p className="font-medium text-foreground-muted">Chargement du menu...</p>
      </div>
    )
  }

  return (
    <div className="pb-24">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-surface px-4 font-bold text-foreground-muted transition-[color,transform] duration-200 hover:text-white active:scale-[0.97]"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour au plan
          </button>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-teal">Ordering for Table {tableId}</p>
            {activeOrder && (
              <span className="rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter text-amber border border-amber/30">
                Commande #{activeOrder.id} active
              </span>
            )}
          </div>
          <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">Table {tableId}</h1>
        </div>
      </header>

      {error && (
        <div className="mb-5 rounded-lg border border-[#E76F51]/30 bg-[#E76F51]/10 p-4 font-medium text-[#E76F51]">
          {error}
        </div>
      )}

      {success ? (
        <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4 rounded-lg border border-white/10 bg-surface">
          <CheckCircle2 className="h-16 w-16 text-teal" />
          <p className="text-xl font-bold text-white">Commande envoyée</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeOrder && activeOrder.lignes.length > 0 && (
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground-muted">Éléments déjà commandés</p>
              <div className="space-y-2">
                {activeOrder.lignes.map((ligne: any) => (
                  <div key={ligne.id} className="flex items-center justify-between rounded-lg bg-black/20 p-2 px-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-teal">x{ligne.quantite}</span>
                      <span className="font-medium text-white">{ligne.plat_details?.nom || `Plat #${ligne.plat}`}</span>
                    </div>
                    <span className="font-medium text-foreground-muted">Prêt</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <CategoryTabs
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
          <DishGrid tableId={tableId} dishes={dishes} selectedCategoryId={selectedCategoryId} />
        </div>
      )}

      <FloatingCart itemCount={cartItemCount} total={cartTotal} onOpen={() => setIsReviewOpen(true)} />
      <OrderReview
        isOpen={isReviewOpen}
        items={cartItems}
        total={cartTotal}
        isSubmitting={isSubmitting}
        onClose={() => setIsReviewOpen(false)}
        onSubmit={submitOrder}
      />
    </div>
  )
}
