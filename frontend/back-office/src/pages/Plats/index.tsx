import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@shared/auth/axiosInstance';
import { Plus, Filter } from 'lucide-react';
import { Category, Plat } from './types';
import { useResponsiveListView } from './useResponsiveListView';
import { PlatListTable } from './PlatListTable';
import { PlatMobileCard } from './PlatMobileCard';
import { PlatDrawer } from './PlatDrawer';

const PlatsPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPlat, setEditingPlat] = useState<Plat | null>(null);

  const listMode = useResponsiveListView();

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/categories/');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  }, []);

  const fetchPlats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const platsUrl = selectedCategoryId === 'all' 
        ? '/plats/' 
        : `/plats/?categorie=${selectedCategoryId}`;
      const res = await axiosInstance.get(platsUrl);
      setPlats(res.data);
    } catch (err: any) {
      console.error('Failed to fetch plats', err);
      setError('Une erreur est survenue lors du chargement des plats.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategoryId]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchCategories(), fetchPlats()]);
    setIsLoading(false);
  }, [fetchCategories, fetchPlats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleStatus = async (plat: Plat, field: 'est_active' | 'est_disponible') => {
    setIsProcessing(plat.id);
    const nextStatus = !plat[field];
    try {
      await axiosInstance.patch(`/plats/${plat.id}/`, { [field]: nextStatus });
      setPlats(prev => prev.map(p => p.id === plat.id ? { ...p, [field]: nextStatus } : p));
    } catch (err) {
      console.error('Status toggle failed', err);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (plat: Plat) => {
    setIsProcessing(plat.id);
    try {
      await axiosInstance.delete(`/plats/${plat.id}/`);
      setPlats(prev => prev.filter(p => p.id !== plat.id));
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleEdit = (plat: Plat) => {
    setEditingPlat(plat);
    setIsDrawerOpen(true);
  };

  const handleCreate = () => {
    setEditingPlat(null);
    setIsDrawerOpen(true);
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestion des Plats</h1>
          <p className="text-foreground-muted">Gérez les plats de votre restaurant.</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-teal-500 hover:bg-teal-400 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-teal-500/20 active:scale-[0.98]"
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
              ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
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
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
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
        <div className="bg-surface rounded-xl border border-white/5 overflow-hidden shadow-lg">
          {plats.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <p className="text-foreground-muted text-lg">
                {selectedCategoryId === 'all' 
                  ? "Aucun plat n'a été créé pour le moment." 
                  : `Aucun plat trouvé dans la catégorie "${selectedCategory?.nom}".`}
              </p>
              <button
                onClick={handleCreate}
                className="text-teal-500 hover:text-teal-400 font-bold transition-colors"
              >
                + Ajouter le premier plat {selectedCategoryId !== 'all' && `pour ${selectedCategory?.nom}`}
              </button>
            </div>
          ) : listMode === 'desktop' ? (
            <PlatListTable
              plats={plats}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              isProcessing={isProcessing}
            />
          ) : (
            <div className="p-4 grid grid-cols-1 gap-4">
              {plats.map(plat => (
                <PlatMobileCard
                  key={plat.id}
                  plat={plat}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                  isProcessing={isProcessing === plat.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <PlatDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={fetchPlats}
        initialData={editingPlat}
        categories={categories}
        defaultCategoryId={selectedCategoryId}
      />
    </div>
  );
};

export default PlatsPage;
