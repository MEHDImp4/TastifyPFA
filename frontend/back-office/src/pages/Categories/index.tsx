import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import axiosInstance from '@shared/auth/axiosInstance';
import { CategoryList } from './CategoryList';
import { CategoryDrawer } from './CategoryDrawer';

interface Category {
  id: number;
  nom: string;
  description: string;
  ordre_affichage: number;
  image: string;
  est_active: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/api/categories/');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = () => {
    setEditingCategory(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Catégories</h1>
          <p className="text-foreground-muted">Gérez les catégories de votre menu.</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-teal-500 hover:bg-teal-400 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-teal-500/20"
        >
          <Plus size={20} />
          Nouvelle Catégorie
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
        </div>
      ) : (
        <CategoryList
          categories={categories}
          onEdit={handleEdit}
          onRefresh={fetchCategories}
        />
      )}

      <CategoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={fetchCategories}
        initialData={editingCategory}
      />
    </div>
  );
}
