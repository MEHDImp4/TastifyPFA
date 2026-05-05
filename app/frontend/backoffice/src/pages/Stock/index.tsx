import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import axiosInstance from '@shared/auth/axiosInstance';
import { IngredientList } from './IngredientList';
import { IngredientMobileCard } from './IngredientMobileCard';
import { IngredientDrawer } from './IngredientDrawer';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { Switch } from '../../components/ui/Switch';
import { Ingredient } from './types';
import { useAuthStore } from '@shared/auth/useAuthStore';

export default function StockPage() {
  const { user } = useAuthStore();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);

  const isGerant = user?.role === 'GERANT';

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/stock/ingredients/');
      setIngredients(response.data);
    } catch (err) {
      console.error('Failed to fetch ingredients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleEdit = (ingredient: Ingredient) => {
    if (!isGerant) return;
    setSelectedIngredient(ingredient);
    setIsDrawerOpen(true);
  };

  const handleToggleActive = (id: number, isActive: boolean) => {
    setIngredients(prev => prev.map(ing => ing.id === id ? { ...ing, est_active: isActive } : ing));
  };

  const handleAdjust = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIsAdjustmentModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedIngredient(null);
    setIsDrawerOpen(true);
  };

  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAlert = showOnlyAlerts ? ing.stock_actuel <= ing.seuil_alerte * 1.2 : true;
    return matchesSearch && matchesAlert;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestion du Stock</h1>
          <p className="text-foreground-muted">Gérez vos ingrédients et surveillez les niveaux de stock.</p>
        </div>
        {isGerant && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-teal hover:bg-teal/80 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-teal/20 active:scale-95"
          >
            <Plus size={20} />
            Ajouter un ingrédient
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-surface p-4 rounded-xl border border-surface-elevated">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" size={20} />
          <input
            type="text"
            placeholder="Rechercher un ingrédient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-elevated border-none focus:ring-2 focus:ring-teal rounded-xl pl-10 pr-4 py-2 text-white"
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-surface-elevated/50 rounded-xl border border-surface-elevated shrink-0">
          <AlertTriangle size={18} className={showOnlyAlerts ? 'text-amber' : 'text-foreground-muted'} />
          <span className="text-sm font-medium text-white">Alertes uniquement</span>
          <Switch checked={showOnlyAlerts} onToggle={() => setShowOnlyAlerts(!showOnlyAlerts)} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal"></div>
        </div>
      ) : (
        <>
          {/* Desktop View */}
          <div className="hidden md:block">
            <IngredientList
              ingredients={filteredIngredients}
              onEdit={handleEdit}
              onAdjust={handleAdjust}
              onRefresh={fetchIngredients}
              onToggleActive={handleToggleActive}
              isGerant={isGerant}
            />
          </div>

          {/* Mobile View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredIngredients.length === 0 ? (
              <div className="bg-surface p-8 text-center text-foreground-muted rounded-xl border border-surface-elevated">
                {searchTerm || showOnlyAlerts ? 'Aucun résultat correspondant.' : 'Aucun ingrédient trouvé.'}
              </div>
            ) : (
              filteredIngredients.map((ingredient) => (
                <IngredientMobileCard
                  key={ingredient.id}
                  ingredient={ingredient}
                  onEdit={handleEdit}
                  onAdjust={handleAdjust}
                  onRefresh={fetchIngredients}
                  onToggleActive={handleToggleActive}
                />
              ))
            )}
          </div>
        </>
      )}

      <IngredientDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={fetchIngredients}
        initialData={selectedIngredient}
      />

      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSuccess={fetchIngredients}
        ingredient={selectedIngredient}
      />
    </div>
  );
}
