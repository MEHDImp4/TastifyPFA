import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import axiosInstance from '@shared/auth/axiosInstance';
import { useAuthStore } from '@shared/auth/useAuthStore';
import { Ingredient, PlatIngredient } from '../Stock/types';

interface PlatRecetteTabProps {
  platId: number;
}

export function PlatRecetteTab({ platId }: PlatRecetteTabProps) {
  const { user } = useAuthStore();
  const isManager = user?.role === 'GERANT';

  const [links, setLinks] = useState<PlatIngredient[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [quantite, setQuantite] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [platId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [linksRes, ingredientsRes] = await Promise.all([
        axiosInstance.get<PlatIngredient[]>(`/stock/plat-ingredients/?plat=${platId}`),
        axiosInstance.get<Ingredient[]>('/stock/ingredients/')
      ]);
      setLinks(linksRes.data);
      setIngredients(ingredientsRes.data.filter(i => i.est_active));
    } catch (err) {
      console.error('Failed to fetch recipe data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async () => {
    if (!selectedIngredientId || !quantite) return;
    
    setIsAdding(true);
    try {
      const res = await axiosInstance.post<PlatIngredient>('/stock/plat-ingredients/', {
        plat: platId,
        ingredient: parseInt(selectedIngredientId),
        quantite_requise: parseFloat(quantite)
      });
      setLinks([...links, res.data]);
      setSelectedIngredientId('');
      setQuantite('');
    } catch (err) {
      console.error('Failed to add ingredient', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateQuantity = async (linkId: number, newQty: string) => {
    const parsedQty = parseFloat(newQty);
    if (isNaN(parsedQty)) return;

    setIsSaving(linkId);
    try {
      const res = await axiosInstance.patch<PlatIngredient>(`/stock/plat-ingredients/${linkId}/`, {
        quantite_requise: parsedQty
      });
      setLinks(links.map(l => l.id === linkId ? res.data : l));
    } catch (err) {
      console.error('Failed to update quantity', err);
    } finally {
      setIsSaving(null);
    }
  };

  const handleDeleteLink = async (linkId: number) => {
    if (!confirm('Voulez-vous vraiment retirer cet ingrédient de la recette ?')) return;

    try {
      await axiosInstance.delete(`/stock/plat-ingredients/${linkId}/`);
      setLinks(links.filter(l => l.id !== linkId));
    } catch (err) {
      console.error('Failed to delete link', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin text-teal-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-teal-500 uppercase tracking-widest">Ingrédients requis</h3>
        
        {links.length === 0 ? (
          <p className="text-sm text-foreground-muted italic">Aucun ingrédient configuré pour ce plat.</p>
        ) : (
          <div className="space-y-3">
            {links.map(link => {
              const ing = ingredients.find(i => i.id === link.ingredient);
              return (
                <div key={link.id} className="flex items-center gap-3 bg-surface-elevated p-3 rounded-lg border border-white/5">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{ing?.nom || 'Ingrédient inconnu'}</p>
                    <p className="text-xs text-foreground-muted uppercase">{ing?.unite_mesure}</p>
                  </div>
                  
                  <div className="w-24">
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={link.quantite_requise}
                      disabled={!isManager || isSaving === link.id}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val !== link.quantite_requise) {
                          handleUpdateQuantity(link.id, e.target.value);
                        }
                      }}
                      className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                    />
                  </div>

                  {isManager && (
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="text-red-400 hover:text-red-300 p-1 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isManager && (
        <div className="pt-4 border-t border-white/5 space-y-4">
          <h3 className="text-xs font-bold text-teal-500 uppercase tracking-widest">Ajouter un ingrédient</h3>
          
          <div className="flex gap-2">
            <select
              value={selectedIngredientId}
              onChange={(e) => setSelectedIngredientId(e.target.value)}
              className="flex-1 bg-surface-elevated border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
            >
              <option value="">Sélectionner...</option>
              {ingredients
                .filter(ing => !links.some(l => l.ingredient === ing.id))
                .map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.nom} ({ing.unite_mesure})</option>
                ))}
            </select>

            <input
              type="number"
              placeholder="Qté"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              className="w-20 bg-surface-elevated border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <button
              onClick={handleAddLink}
              disabled={isAdding || !selectedIngredientId || !quantite}
              className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white p-2 rounded-lg transition-colors flex items-center justify-center min-w-[40px]"
            >
              {isAdding ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
