import { IngredientRow } from './IngredientRow';
import { Ingredient } from './types';

interface IngredientListProps {
  ingredients: Ingredient[];
  onEdit: (ingredient: Ingredient) => void;
  onAdjust: (ingredient: Ingredient) => void;
  onRefresh: () => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  isGerant: boolean;
}

export function IngredientList({ ingredients, onEdit, onAdjust, onRefresh, onToggleActive, isGerant }: IngredientListProps) {
  return (
    <div className="overflow-x-auto bg-surface rounded-xl shadow-lg border border-surface-elevated">
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-elevated text-foreground-muted text-sm uppercase tracking-wider">
          <tr>
            <th className="px-6 py-4 font-semibold">Nom</th>
            <th className="px-6 py-4 font-semibold">Stock Actuel</th>
            <th className="px-6 py-4 font-semibold">Unité</th>
            <th className="px-6 py-4 font-semibold">Seuil Alerte</th>
            <th className="px-6 py-4 font-semibold">Actif</th>
            <th className="px-6 py-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-foreground-muted">
                Aucun ingrédient trouvé.
              </td>
            </tr>
          ) : (
            ingredients.map((ingredient) => (
              <IngredientRow
                key={ingredient.id}
                ingredient={ingredient}
                onEdit={onEdit}
                onAdjust={onAdjust}
                onRefresh={onRefresh}
                onToggleActive={onToggleActive}
                isGerant={isGerant}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
