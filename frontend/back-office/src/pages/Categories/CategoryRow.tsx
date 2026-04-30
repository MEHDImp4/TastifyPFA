import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import axiosInstance from '@shared/auth/axiosInstance';
import { Switch } from '../../components/ui/Switch';
import { normalizeMediaUrl } from '@shared/media/mediaUrl';

interface Category {
  id: number;
  nom: string;
  description: string;
  ordre_affichage: number;
  image: string;
  est_active: boolean;
}

interface CategoryRowProps {
  category: Category;
  onEdit: (category: Category) => void;
  onRefresh: () => void;
}

export function CategoryRow({ category, onEdit, onRefresh }: CategoryRowProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isActive, setIsActive] = useState(category.est_active);

  useEffect(() => {
    setIsActive(category.est_active);
  }, [category.est_active]);

  useEffect(() => {
    if (isConfirming) {
      const timer = setTimeout(() => setIsConfirming(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirming]);

  const handleToggle = async () => {
    const nextStatus = !isActive;
    setIsActive(nextStatus);
    try {
      await axiosInstance.patch(`/categories/${category.id}/`, { est_active: nextStatus });
      onRefresh();
    } catch (err) {
      setIsActive(!nextStatus);
      console.error('Toggle failed', err);
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/categories/${category.id}/`);
      onRefresh();
    } catch (err) {
      console.error('Delete failed', err);
      setIsConfirming(false);
    }
  };

  return (
    <tr className={`border-b border-surface-elevated transition-opacity ${isActive ? '' : 'opacity-50'}`}>
      <td className="px-6 py-4">
        {category.image ? (
          <img src={normalizeMediaUrl(category.image)} alt={category.nom} className="w-12 h-12 rounded object-cover" />
        ) : (
          <div className="w-12 h-12 rounded bg-surface-elevated flex items-center justify-center text-xs text-foreground-muted">
            No Image
          </div>
        )}
      </td>
      <td className="px-6 py-4 font-medium">{category.nom}</td>
      <td className="px-6 py-4">{category.ordre_affichage}</td>
      <td className="px-6 py-4">
        <Switch checked={isActive} onToggle={handleToggle} />
      </td>
      <td className="px-6 py-4">
        {isConfirming ? (
          <div className="flex gap-4 items-center">
            <button
              onClick={handleDelete}
              className="text-error hover:underline text-sm font-bold"
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
            <button
              onClick={() => onEdit(category)}
              className="text-teal-500 hover:text-teal-400 transition-colors"
              aria-label="Edit"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => setIsConfirming(true)}
              className="text-orange-500 hover:text-orange-400 transition-colors"
              aria-label="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
