import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@shared/auth/axiosInstance';
import { Plus, Filter } from 'lucide-react';
import { Category, Plat } from './types';
import { useResponsiveListView } from './useResponsiveListView';

const PlatsPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listMode = useResponsiveListView();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const categoriesRes = await axiosInstance.get('/categories/');
      setCategories(categoriesRes.data);

      const platsUrl = selectedCategoryId === 'all' 
        ? '/plats/' 
        : `/plats/?categorie=${selectedCategoryId}`;
      const platsRes = await axiosInstance.get(platsUrl);
      setPlats(platsRes.data);
    } catch (err: any) {
      console.error('Failed to fetch data', err);
      setError('Une erreur est survenue lors du chargement des données.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestion des Plats</h1>
          <p className="text-foreground-muted">Gérez les plats de votre restaurant.</p>
        </div>
        <button
          className="bg-teal-500 hover:bg-teal-400 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-teal-500/20"
        >
          <Plus size={20} />
          Nouveau Plat
        </button>
      </div>

      <div className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 text-foreground-muted mr-2 shrink-0">
          <Filter size={18} />
          <span className="text-sm font-medium">Filtrer par:</span>
        </div>
        
        <button
          onClick={() => setSelectedCategoryId('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            selectedCategoryId === 'all'
              ? 'bg-teal-500 text-white'
              : 'bg-surface-elevated text-foreground-muted hover:text-white'
          }`}
        >
          Tous
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategoryId === cat.id
                ? 'bg-teal-500 text-white'
                : 'bg-surface-elevated text-foreground-muted hover:text-white'
            }`}
          >
            {cat.nom}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 text-sm font-medium text-white hover:underline"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
          {/* Responsive list will go here in next sub-phases */}
          <div className="p-10 text-center">
            <p className="text-foreground-muted">
              {plats.length} plats trouvés ({listMode === 'desktop' ? 'Mode Bureau' : 'Mode Mobile'})
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatsPage;
