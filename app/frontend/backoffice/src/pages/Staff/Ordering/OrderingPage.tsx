import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronUp, Loader2, Receipt } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import axiosInstance from '@shared/auth/axiosInstance'
import { useAuthStore } from '@shared/auth/useAuthStore'
import { useStaffWebSocket } from '@shared/websocket/WebSocketProvider'
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
  const currentUser = useAuthStore((state: any) => state.user)
  const { lastEvent } = useStaffWebSocket()
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
  const [isOrderExpanded, setIsOrderExpanded] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const getCart = useOrderStore((state) => state.getCart)
  const getCartTotal = useOrderStore((state) => state.getCartTotal)
  const getCartItemCount = useOrderStore((state) => state.getCartItemCount)
  const clearCart = useOrderStore((state) => state.clearCart)
  const carts = useOrderStore((state) => state.carts)

  const cartItems = useMemo(() => getCart(tableId), [carts, getCart, tableId])
  const cartTotal = useMemo(() => getCartTotal(tableId), [carts, getCartTotal, tableId])
  const cartItemCount = useMemo(() => getCartItemCount(tableId), [carts, getCartItemCount, tableId])

  useEffect(() => {
    audioRef.current = new Audio('/sounds/kitchen-bell.mp3') // Reusing bell for now
    audioRef.current.preload = 'auto'
    return () => {
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!lastEvent || !activeOrder) return

    if (lastEvent.type === 'order_updated' && lastEvent.payload.order.id === activeOrder.id) {
      const updatedOrder = lastEvent.payload.order
      
      // Play sound if order becomes PRETE
      if (updatedOrder.statut === 'PRETE' && activeOrder.statut !== 'PRETE') {
        audioRef.current?.play().catch(() => {})
      }
      
      setActiveOrder(updatedOrder)
    }
  }, [lastEvent, activeOrder])

  useEffect(() => {
    if (!Number.isInteger(tableId) || tableId <= 0) {
      setError('Table introuvable.')
      setIsLoading(false)
      return
    }

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
        const order = ordersResponse.data.length > 0 ? ordersResponse.data[0] : null
        setActiveOrder(order)
        // If there's an active order, start collapsed on mobile to save space
        setIsOrderExpanded(false)
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
        await axiosInstance.post(`/commandes/${activeOrder.id}/add_items/`, 
          cartItems.map((item) => ({
            plat: item.plat.id,
            quantite: item.quantity,
          }))
        )
      } else {
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

      clearCart(tableId)
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
    <div className="pb-32 px-4 sm:px-0">
      <header className="py-4 flex items-center justify-between sticky top-0 z-40 bg-background/80 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-surface text-foreground-muted transition-all active:scale-90"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white leading-none">Table {tableId}</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-teal mt-1">Zone Salle</p>
          </div>
        </div>
        
        {activeOrder && (
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-black uppercase tracking-tighter text-amber flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
               #{activeOrder.id}
             </span>
             <p className="text-sm font-black text-white tabular-nums">{activeOrder.montant_total} DH</p>
          </div>
        )}
      </header>

      {!isOwnOrder && (
        <div className="my-4 rounded-xl border border-amber/20 bg-amber/5 p-3 text-xs font-medium text-amber">
          Gérée par <span className="font-black underline">{activeOrder.serveur_name}</span>. Lecture seule.
        </div>
      )}

      {error && (
        <div className="my-4 rounded-xl border border-error/20 bg-error/5 p-3 text-xs font-medium text-error">
          {error}
        </div>
      )}

      {success ? (
        <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4 rounded-3xl border border-white/5 bg-surface mt-6">
          <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center border border-teal/20">
            <CheckCircle2 className="h-10 w-10 text-teal" />
          </div>
          <p className="text-lg font-black text-white">Opération réussie</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {activeOrder && (
            <div className="rounded-2xl border border-white/5 bg-surface overflow-hidden transition-all duration-300">
              <button 
                onClick={() => setIsOrderExpanded(!isOrderExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center border border-teal/20">
                    <Receipt className="h-4 w-4 text-teal" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-widest text-white">Commande Active</p>
                    <p className="text-[10px] text-foreground-muted">{activeOrder.lignes.length} article(s)</p>
                  </div>
                </div>
                {isOrderExpanded ? <ChevronUp className="h-4 w-4 text-foreground-muted" /> : <ChevronDown className="h-4 w-4 text-foreground-muted" />}
              </button>
              
              {isOrderExpanded && (
                <div className="p-4 pt-0 space-y-4 animate-enter">
                  <div className="h-px bg-white/5 -mx-4" />
                  <div className="space-y-2">
                    {activeOrder.lignes.length === 0 ? (
                      <p className="text-xs text-foreground-muted italic py-2">Aucun plat.</p>
                    ) : (
                      activeOrder.lignes.map((ligne: any) => {
                        const isPret = ligne.statut === 'PRET' || ligne.statut === 'SERVI'
                        return (
                          <div key={ligne.id} className={`flex items-center justify-between rounded-xl p-3 border transition-all ${isPret ? 'bg-green-500/10 border-green-500/20' : 'bg-white/[0.03] border-white/5'}`}>
                            <div className="flex items-center gap-3">
                              <span className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black ${isPret ? 'bg-green-500 text-white' : 'bg-teal/20 text-teal'}`}>
                                {ligne.quantite}
                              </span>
                              <span className={`text-xs font-bold tracking-tight ${isPret ? 'text-green-400' : 'text-white'}`}>{ligne.plat_details?.nom || `Plat #${ligne.plat}`}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isPret ? (
                                <>
                                  <CheckCircle2 size={12} className="text-green-500" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-green-500">Prêt</span>
                                </>
                              ) : (
                                <>
                                  <div className="h-1 w-1 rounded-full bg-teal animate-pulse" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-teal">Cuisine</span>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {isOwnOrder && (
                    <div className="grid grid-cols-1 gap-2 pt-2">
                      {activeOrder?.statut === 'EN_COURS' && (
                        <button
                          type="button"
                          disabled={isFiring}
                          onClick={fireOrderToKitchen}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal font-black text-[11px] uppercase tracking-widest text-white shadow-lg shadow-teal/20 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                          {isFiring ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Envoyer en Cuisine'}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={closeOrder}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface-elevated border border-white/10 font-black text-[11px] uppercase tracking-widest text-white transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Clôturer et Encaisser'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isOwnOrder && (
            <div className="space-y-4">
              <div className="sticky top-[72px] z-30 bg-background/80 backdrop-blur-md -mx-4 px-4 py-2 border-b border-white/5">
                <CategoryTabs
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  onSelect={setSelectedCategoryId}
                />
              </div>
              <div className="px-0 sm:px-0">
                <DishGrid tableId={tableId} dishes={dishes} selectedCategoryId={selectedCategoryId} />
              </div>
            </div>
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

