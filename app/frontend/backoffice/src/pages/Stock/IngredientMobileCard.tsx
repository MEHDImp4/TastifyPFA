import React from 'react';
import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import { Ingredient } from './types';
import { Switch } from '../../components/ui/Switch';
import axiosInstance from '@shared/auth/axiosInstance';
import { useAuthStore } from '@shared/auth/useAuthStore';

interface IngredientMobileCardProps {
  ingredient: Ingredient;
  onEdit: (ingredient: Ingredient) => void;
  onAdjust: (ingredient: Ingredient) => void;
  onRefresh: () => void;
  onToggleActive: (id: number, isActive: boolean) => void;
}

export function IngredientMobileCard({ ingredient, onEdit, onAdjust, onRefresh, onToggleActive }: IngredientMobileCardProps) {
  const { user } = useAuthStore();
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isActive, setIsActive] = React.useState(ingredient.est_active);
  const [isToggling, setIsToggling] = React.useState(false);

  const isGerant = user?.role === 'GERANT';
  const stockValue = Number(ingredient.stock_actuel);
  const threshold = Number(ingredient.seuil_alerte);
  
  const isAlert = stockValue <= threshold;
  const isWarning = !isAlert && stockValue <= threshold * 1.2;

  const stockColorClass = isAlert 
    ? 'text-terracotta' 
    : isWarning 
      ? 'text-amber' 
      : 'text-teal-500';

  React.useEffect(() => {
    setIsActive(ingredient.est_active);
  }, [ingredient.est_active]);

  const handleToggle = async () => {
    if (isToggling) return;
    const nextStatus = !isActive;
    setIsToggling(true);
    setIsActive(nextStatus);
    try {
      await axiosInstance.patch(`/stock/ingredients/${ingredient.id}/`, { est_active: nextStatus });
      onToggleActive(ingredient.id, nextStatus);
    } catch (err) {
      setIsActive(!nextStatus);
      console.error('Toggle failed', err);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/stock/ingredients/${ingredient.id}/`);
      onRefresh();
    } catch (err) {
      console.error('Delete failed', err);
      setIsConfirming(false);
    }
  };

  return (
    <div className={`bg-surface p-4 rounded-xl border border-surface-elevated space-y-4 ${isActive ? '' : 'opacity-50'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg text-white">{ingredient.nom}</h3>
          <p className="text-sm text-foreground-muted">Unité: {ingredient.unite_mesure}</p>
        </div>
        <Switch checked={isActive} onToggle={handleToggle} disabled={!isGerant || isToggling} />
      </div>

      <div className="grid grid-cols-2 gap-4 bg-surface-elevated/30 p-3 rounded-lg border border-white/5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1">Stock Actuel</p>
          <div className="flex items-center gap-2">
            <p className={`text-xl font-black ${stockColorClass}`}>
              {ingredient.stock_actuel}
            </p>
            {isAlert && <div className="w-2 h-2 rounded-full bg-terracotta animate-pulse" />}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1">Seuil Alerte</p>
          <p className="text-xl font-bold text-white">
            {ingredient.seuil_alerte}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        {isConfirming ? (
          <div className="flex gap-4 items-center w-full justify-center">
            <button
              onClick={handleDelete}
              className="text-terracotta hover:underline text-sm font-bold"
            >
              Confirmer Suppression
            </button>
            <button
              onClick={() => setIsConfirming(false)}
              className="text-foreground-muted hover:underline text-sm"
            >
              Annuler
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-3">
              {isGerant && (
                <button
                  onClick={() => onEdit(ingredient)}
                  className="p-3 rounded-xl bg-white/5 text-foreground-muted hover:text-white transition-all active:scale-90"
                  title="Modifier"
                >
                  <Pencil size={18} />
                </button>
              )}
              <button
                className="p-3 rounded-xl bg-teal/10 text-teal hover:bg-teal hover:text-white transition-all active:scale-90"
                title="Ajuster Stock"
                onClick={() => onAdjust(ingredient)}
              >
                <PlusCircle size={18} />
              </button>
            </div>
            {isGerant && (
              <button
                onClick={() => setIsConfirming(true)}
                className="p-3 rounded-xl bg-white/5 text-foreground-muted hover:text-terracotta transition-all active:scale-90"
                title="Supprimer"
              >
                <Trash2 size={18} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
