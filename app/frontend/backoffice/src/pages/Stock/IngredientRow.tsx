import { useState, useEffect } from 'react';
import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import axiosInstance from '@shared/auth/axiosInstance';
import { Switch } from '../../components/ui/Switch';
import { Ingredient } from './types';

interface IngredientRowProps {
  ingredient: Ingredient;
  onEdit: (ingredient: Ingredient) => void;
  onAdjust: (ingredient: Ingredient) => void;
  onRefresh: () => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  isGerant: boolean;
}

export function IngredientRow({ ingredient, onEdit, onAdjust, onRefresh, onToggleActive, isGerant }: IngredientRowProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isActive, setIsActive] = useState(ingredient.est_active);
  const [isToggling, setIsToggling] = useState(false);

  const stockValue = Number(ingredient.stock_actuel);
  const threshold = Number(ingredient.seuil_alerte);
  
  const isAlert = stockValue <= threshold;
  const isWarning = !isAlert && stockValue <= threshold * 1.2;

  const stockColorClass = isAlert 
    ? 'text-terracotta font-black' 
    : isWarning 
      ? 'text-amber font-bold' 
      : 'text-white font-medium';

  useEffect(() => {
    setIsActive(ingredient.est_active);
  }, [ingredient.est_active]);

  useEffect(() => {
    if (isConfirming) {
      const timer = setTimeout(() => setIsConfirming(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirming]);

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
    <tr className={`border-b border-surface-elevated transition-all ${isActive ? '' : 'opacity-40'}`}>
      <td className="px-6 py-4 font-bold text-white">{ingredient.nom}</td>
      <td className="px-6 py-4 text-foreground-muted">{ingredient.unite_mesure}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={`${stockColorClass} text-lg`}>
            {ingredient.stock_actuel}
          </span>
          {isAlert && <div className="w-2 h-2 rounded-full bg-terracotta animate-pulse" />}
          {isWarning && <div className="w-2 h-2 rounded-full bg-amber" />}
        </div>
      </td>
      <td className="px-6 py-4 text-foreground-muted">{ingredient.seuil_alerte}</td>
      <td className="px-6 py-4">
        <Switch checked={isActive} onToggle={handleToggle} disabled={!isGerant || isToggling} />
      </td>
      <td className="px-6 py-4">
        {isConfirming ? (
          <div className="flex gap-4 items-center">
            <button
              onClick={handleDelete}
              className="text-terracotta hover:underline text-sm font-bold"
            >
              Confirmer
            </button>
            <button
              onClick={() => setIsConfirming(false)}
              className="text-foreground-muted hover:underline text-sm"
            >
              Annuler
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            {isGerant && (
              <button
                onClick={() => onEdit(ingredient)}
                className="p-2 rounded-lg bg-white/5 text-foreground-muted hover:text-white transition-all hover:bg-white/10 active:scale-90"
                title="Modifier"
              >
                < Pencil size={18} />
              </button>
            )}
            <button
              className="p-2 rounded-lg bg-teal/10 text-teal hover:text-white transition-all hover:bg-teal active:scale-90"
              title="Ajuster Stock"
              onClick={() => onAdjust(ingredient)}
            >
              <PlusCircle size={18} />
            </button>
            {isGerant && (
              <button
                onClick={() => setIsConfirming(true)}
                className="p-2 rounded-lg bg-white/5 text-foreground-muted hover:text-terracotta transition-all hover:bg-terracotta/10 active:scale-90"
                title="Supprimer"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
