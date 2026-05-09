import { Plus, Search, Filter, Loader2, Brain } from 'lucide-react'
import { useEffect, useState } from 'react'
import axios from '@shared/auth/axiosInstance'
import { useAuthStore } from '@shared/auth/useAuthStore'
import { Ingredient } from './types'
import { IngredientList } from './IngredientList'
import { IngredientDrawer } from './IngredientDrawer'
import { StockAdjustmentModal } from './StockAdjustmentModal'
import { StockForecasting } from './StockForecasting'

const StockPage = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'FORECAST'>('INVENTORY')

  const { user } = useAuthStore()
  const isGerant = user?.role === 'GERANT'

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false)

  const fetchIngredients = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/ingredients/')
      setIngredients(response.data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch ingredients', err)
      setError('Impossible de charger le stock.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIngredients()
  }, [])

  const filteredIngredients = ingredients.filter((ing) =>
    ing.nom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenDrawer = (ingredient?: Ingredient) => {
    setSelectedIngredient(ingredient || null)
    setIsDrawerOpen(true)
  }

  const handleSaveIngredient = async () => {
    await fetchIngredients()
    setIsDrawerOpen(false)
  }

  const handleAdjustStock = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient)
    setIsAdjustmentModalOpen(true)
  }

  const handleStockAdjusted = async () => {
    await fetchIngredients()
    setIsAdjustmentModalOpen(false)
  }

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await axios.patch(`/ingredients/${id}/`, { est_active: isActive })
      await fetchIngredients()
    } catch (err) {
      console.error('Failed to toggle ingredient state', err)
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Gestion du Stock</h1>
          <p className="mt-1 text-sm font-medium text-foreground-muted">
            Suivez vos ingrédients, ajustez les quantités et anticipez vos besoins.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'INVENTORY' && isGerant && (
            <button
              onClick={() => handleOpenDrawer()}
              className="flex h-11 items-center gap-2 rounded-xl bg-teal px-6 text-sm font-black text-surface shadow-lg shadow-teal/20 transition-all hover:bg-teal-light active:scale-95"
            >
              <Plus size={18} />
              Nouvel Ingrédient
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-white/5 p-1 border border-white/5 w-fit">
        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
            activeTab === 'INVENTORY'
              ? 'bg-teal text-surface shadow-lg shadow-teal/20'
              : 'text-foreground-muted hover:text-white hover:bg-white/5'
          }`}
        >
          Inventaire
        </button>
        <button
          onClick={() => setActiveTab('FORECAST')}
          className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
            activeTab === 'FORECAST'
              ? 'bg-teal text-surface shadow-lg shadow-teal/20'
              : 'text-foreground-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Brain size={14} />
          Prévisions IA
        </button>
      </div>

      {activeTab === 'INVENTORY' ? (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted"
                size={18}
              />
              <input
                type="text"
                placeholder="Rechercher un ingrédient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 w-full rounded-2xl border border-white/5 bg-white/5 pl-12 pr-4 text-sm text-white placeholder-white/20 transition-all focus:border-teal/50 focus:bg-white/10 outline-none"
              />
            </div>
            <button className="flex h-12 items-center gap-2 rounded-2xl border border-white/5 bg-white/5 px-6 text-sm font-bold text-foreground-muted transition-all hover:bg-white/10 hover:text-white">
              <Filter size={16} />
              Filtres
            </button>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-white/5 bg-white/5">
              <Loader2 className="h-8 w-8 animate-spin text-teal" />
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-500/10 bg-red-500/5 p-8 text-center">
              <p className="text-sm font-bold text-red-400">{error}</p>
            </div>
          ) : (
            <IngredientList
              ingredients={filteredIngredients}
              onEdit={handleOpenDrawer}
              onAdjust={handleAdjustStock}
              onRefresh={fetchIngredients}
              onToggleActive={handleToggleActive}
              isGerant={isGerant}
            />
          )}
        </>
      ) : (
        <StockForecasting />
      )}

      <IngredientDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        initialData={selectedIngredient}
        onSuccess={handleSaveIngredient}
      />

      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        ingredient={selectedIngredient}
        onSuccess={handleStockAdjusted}
      />
    </div>
  )
}

export default StockPage
