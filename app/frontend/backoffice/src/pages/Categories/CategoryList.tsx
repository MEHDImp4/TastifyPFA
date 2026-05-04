import { CategoryRow } from './CategoryRow';

interface Category {
  id: number;
  nom: string;
  description: string;
  ordre_affichage: number;
  image: string;
  est_active: boolean;
}

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onRefresh: () => void;
}

export function CategoryList({ categories, onEdit, onRefresh }: CategoryListProps) {
  return (
    <div className="overflow-x-auto bg-surface rounded-xl shadow-lg border border-surface-elevated">
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-elevated text-foreground-muted text-sm uppercase tracking-wider">
          <tr>
            <th className="px-6 py-4 font-semibold">Image</th>
            <th className="px-6 py-4 font-semibold">Nom</th>
            <th className="px-6 py-4 font-semibold">Ordre</th>
            <th className="px-6 py-4 font-semibold">Actif</th>
            <th className="px-6 py-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-foreground-muted">
                Aucune catégorie trouvée.
              </td>
            </tr>
          ) : (
            categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                onEdit={onEdit}
                onRefresh={onRefresh}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
