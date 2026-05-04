import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import axiosInstance from '@shared/auth/axiosInstance'
import { useAuthStore } from '@shared/auth/useAuthStore'
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
  const currentUser = useAuthStore((state) => state.user)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [dishes, setDishes] = useState<MenuDish[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFiring, setIsFiring] = useState(false)
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

    // Reset synchronously so stale data from a previous table never shows
    setIsLoading(true)
    setActiveOrder(null)
    setError(null)

    let cancelled = false

    const fetchMenu = async () => {
      try {
        const [categoriesResponse, dishesResponse, ordersResponse] = await Promise.all([
          axiosInstance.get<MenuCategory[]>('/categories/'),
          axiosInstance.get<MenuDish[]>('/plats/'),
          axiosInstance.get<any[]>(`/commandes/?table=${tableId}`),
        ])

        if (cancelled) return

        setCategories(categoriesResponse.data)
        setDishes(dishesResponse.data)
        setActiveOrder(ordersResponse.data.length > 0 ? ordersResponse.data[0] : null)
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load ordering menu', err)
        setError('Impossible de charger le menu.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchMenu()
    return () => { cancelled = true }
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
        // Create new order and immediately fire it to the kitchen
        const createResponse = await axiosInstance.post('/commandes/', {
          table: tableId,
          lignes: cartItems.map((item) => ({
            plat: item.plat.id,
            quantite: item.quantity,
          })),
        })
        await axiosInstance.patch(`/commandes/${createResponse.data.id}/`, { statut: 'EN_CUISINE' })
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

  const closeOrder = async () => {
    if (!activeOrder) return

    setIsSubmitting(true)
    setError(null)

    try {
      await axiosInstance.patch(`/commandes/${activeOrder.id}/`, {
        statut: 'PAYEE'
      })

      setSuccess(true)
      window.setTimeout(() => navigate('/'), 1500)
    } catch (err: any) {
      console.error('Failed to close order', err)
      setError('Impossible de clôturer la commande.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fireOrderToKitchen = async () => {
    if (!activeOrder) return
    setIsFiring(true)
    setError(null)
    try {
      await axiosInstance.patch(`/commandes/${activeOrder.id}/`, { statut: 'EN_CUISINE' })
      setActiveOrder((prev: any) => (prev ? { ...prev, statut: 'EN_CUISINE' } : prev))
    } catch (err: any) {
      setError("Impossible d'envoyer en cuisine.")
    } finally {
      setIsFiring(false)
    }
  }

  // GERANT can always act on any order; SERVEUR is restricted to their own orders
  const isOwnOrder = !activeOrder ||
    activeOrder.serveur_username === currentUser?.username ||
    currentUser?.role === 'GERANT'

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
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-teal">Table {tableId}</p>
            {activeOrder && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter text-amber border border-amber/30">
                  Commande #{activeOrder.id} active
                </span>
                <span className="text-xs font-semibold text-foreground-muted">
                  Par <span className="font-black text-white">{activeOrder.serveur_name || 'Inconnu'}</span>
                </span>
              </div>
            )}
          </div>
          <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">Table {tableId}</h1>
        </div>
      </header>

      {!isOwnOrder && (
        <div className="mb-5 rounded-lg border border-amber/30 bg-amber/10 p-4 font-medium text-amber">
          Cette table est gérée par <span className="font-black">{activeOrder.serveur_name}</span>. Consultation uniquement.
        </div>
      )}

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
          {activeOrder && (
            <div className="rounded-2xl border border-white/10 bg-surface p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted">Éléments commandés</p>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal">Total à payer</span>
                  <p className="text-2xl font-black text-white">{activeOrder.montant_total} <span className="text-sm font-medium text-foreground-muted">DH</span></p>
                </div>
              </div>
              
              {activeOrder.lignes.length === 0 ? (
                <p className="text-sm text-foreground-muted italic">Aucun plat ajouté pour l'instant.</p>
              ) : (
                <div className="space-y-3">
                  {activeOrder.lignes.map((ligne: any) => (
                    <div key={ligne.id} className="flex items-center justify-between rounded-xl bg-white/5 p-3 px-4 transition-colors hover:bg-white/[0.08]">
                      <div className="flex items-center gap-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/10 text-xs font-black text-teal">
                          {ligne.quantite}
                        </span>
                        <span className="font-bold text-white tracking-tight">{ligne.plat_details?.nom || `Plat #${ligne.plat}`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal">En cuisine</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isOwnOrder && (
                <>
                  {activeOrder?.statut === 'EN_COURS' && (
                    <button
                      type="button"
                      disabled={isFiring}
                      onClick={fireOrderToKitchen}
                      className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl bg-teal py-4 font-black uppercase tracking-widest text-white shadow-lg shadow-teal/10 transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isFiring ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        'Tout Envoyer en Cuisine'
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={closeOrder}
                    className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-teal py-4 font-black uppercase tracking-widest text-white shadow-lg shadow-teal/10 transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        Clôturer et Encaisser
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
          {isOwnOrder && (
            <>
              <CategoryTabs
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
              />
              <DishGrid tableId={tableId} dishes={dishes} selectedCategoryId={selectedCategoryId} />
            </>
          )}
        </div>
      )}

      {isOwnOrder && (
        <>
          <FloatingCart itemCount={cartItemCount} total={cartTotal} onOpen={() => setIsReviewOpen(true)} />
          <OrderReview
            isOpen={isReviewOpen}
            items={cartItems}
            total={cartTotal}
            isSubmitting={isSubmitting}
            onClose={() => setIsReviewOpen(false)}
            onSubmit={submitOrder}
          />
        </>
      )}
    </div>
  )
}
