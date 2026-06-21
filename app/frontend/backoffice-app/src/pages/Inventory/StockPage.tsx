import React, { useState, useEffect } from 'react';
import { stockApi } from '../../api/inventory_hr';
import type { Ingredient } from '../../types/inventory';
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Download,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export const StockPage: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedIngredients, setHasLoadedIngredients] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [search, setSearch] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [totalCount, setTotalCount] = useState(0);

  const [nom, setNom] = useState('');
  const [unite, setUnite] = useState<'g' | 'ml' | 'pcs'>('g');
  const [stock, setStock] = useState('0');
  const [seuil, setSeuil] = useState('0');

  const fetchStock = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const res = await stockApi.getIngredientsPage({
        page,
        page_size: itemsPerPage,
        search: search.trim() || undefined,
        est_active: true,
      });
      setIngredients(res.data.results);
      setTotalCount(res.data.count);
    } catch (err) {
      console.error('Failed to fetch stock', err);
      toast.error('Erreur chargement inventaire');
    } finally {
      setIsLoading(false);
      setHasLoadedIngredients(true);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [currentPage, search]);

  const handleOpenEditor = (item?: Ingredient) => {
    if (item) {
      setEditingItem(item);
      setNom(item.nom);
      setUnite(item.unite_mesure as 'g' | 'ml' | 'pcs');
      setStock(item.stock_actuel);
      setSeuil(item.seuil_alerte);
    } else {
      setEditingItem(null);
      setNom('');
      setUnite('g');
      setStock('0');
      setSeuil('0');
    }
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      nom,
      unite_mesure: unite,
      stock_actuel: stock,
      seuil_alerte: seuil,
    };
    try {
      if (editingItem) {
        await stockApi.updateIngredient(editingItem.id, payload);
        toast.success(`${nom} mis à jour`);
      } else {
        await stockApi.createIngredient(payload);
        toast.success(`${nom} créé`);
      }
      setIsEditorOpen(false);
      fetchStock();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Échec enregistrement');
    }
  };

  const handleDelete = async () => {
    if (itemToDelete === null) return;
    try {
      await stockApi.deleteIngredient(itemToDelete);
      toast.success('Ingrédient supprimé');
      setItemToDelete(null);
      setIsDeleteModalOpen(false);
      fetchStock();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Échec suppression');
    }
  };

  const handleExportCSV = async () => {
    try {
      const exportRes = await stockApi.getIngredients({ search: search.trim() || undefined, est_active: true });
      if (exportRes.data.length === 0) return;
      const headers = ['ID', 'DESIGNATION', 'UNITE', 'STOCK', 'SEUIL', 'STATUT'];
      const rows = exportRes.data.map(i => [i.id, i.nom.toUpperCase(), i.unite_mesure.toUpperCase(), i.stock_actuel, i.seuil_alerte]);
      const csvContent = '﻿' + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'STOCK_TASTIFY.csv');
      link.click();
    } catch (err) {
      toast.error('Export impossible');
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const visibleIngredients = ingredients.filter((ingredient) => {
    if (!normalizedSearch) return true;

    return [
      ingredient.nom,
      ingredient.unite_mesure,
      String(ingredient.id),
    ].join(' ').toLowerCase().includes(normalizedSearch);
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  if (isLoading && !hasLoadedIngredients) return <div className="h-full flex items-center justify-center text-on-background"><Loader2 className="w-8 h-8 animate-spin" strokeWidth={1}/></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-body selection:bg-on-background/10 overflow-hidden">
      <header className="flex-none flex flex-wrap justify-between items-center px-4 md:px-8 py-3 md:py-0 min-h-20 border-b border-outline bg-surface gap-3">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center md:gap-4">
          <div className="relative group w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-on-background transition-colors" />
            <input
              type="text"
              aria-label="Rechercher un ingrédient"
              placeholder="Rechercher un ingrédient..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="field-control w-full sm:w-56 pl-10 pr-4 text-[10px] uppercase"
            />
          </div>
          <button onClick={handleExportCSV} className="btn-ghost h-10 px-4">
            <Download className="w-3.5 h-3.5" /> <span>Export CSV</span>
          </button>
          <button onClick={() => handleOpenEditor()} className="btn-primary h-10 px-6">
            <Plus className="w-4 h-4" /> <span>Ajouter</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background custom-scrollbar">
        {isLoading && (
          <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
            Recherche en cours
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {visibleIngredients.map(i => {
            const isLow = parseFloat(i.stock_actuel) < parseFloat(i.seuil_alerte);
            return (
              <div key={i.id} className="atelier-card p-6 flex flex-col justify-between group">
                <div className="flex justify-between items-start mb-6">
                  <span className="font-mono text-[9px] opacity-40">#{i.id}</span>
                  <div className="flex gap-2">
                    <button aria-label={`Modifier ${i.nom}`} onClick={() => handleOpenEditor(i)} className="btn-icon"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button aria-label={`Supprimer ${i.nom}`} onClick={() => { setItemToDelete(i.id); setIsDeleteModalOpen(true); }} className="btn-icon text-error hover:border-error/30 hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-on-background">{i.nom}</h3>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-on-background">{parseFloat(i.stock_actuel).toFixed(0)}</span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{i.unite_mesure}</span>
                  </div>
                  {isLow && (
                    <p className="mt-2 text-[9px] font-bold text-error uppercase tracking-widest">Stock sous le seuil</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-outline pt-4">
          <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
            Total : {totalCount} ingrédients
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <button aria-label="Page précédente" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-icon"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-on-surface-variant">
                <span className="text-on-background">{currentPage}</span>
                <span>/</span>
                <span>{totalPages}</span>
              </div>
              <button aria-label="Page suivante" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-icon"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setIsEditorOpen(false)} />
            <div role="dialog" aria-modal="true" aria-labelledby="stock-editor-title" className="relative w-full max-w-md h-full bg-surface border-l border-outline flex flex-col shadow-2xl">
              <div className="p-8 border-b border-outline bg-surface-container-high">
                <h2 id="stock-editor-title" className="text-sm font-bold text-on-background uppercase tracking-[0.3em]">
                  {editingItem ? 'Modifier l\'ingrédient' : 'Nouvel ingrédient'}
                </h2>
              </div>
              <div className="p-6 md:p-10 space-y-8 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <label htmlFor="stock-name" className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Désignation</label>
                  <input id="stock-name" value={nom} onChange={e => setNom(e.target.value)} type="text" className="field-control" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="stock-unit" className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Unité</label>
                  <select id="stock-unit" value={unite} onChange={e => setUnite(e.target.value as 'g' | 'ml' | 'pcs')} className="field-control">
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="stock-current" className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Stock actuel</label>
                  <input id="stock-current" value={stock} onChange={e => setStock(e.target.value)} type="number" className="field-control" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="stock-threshold" className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Seuil alerte</label>
                  <input id="stock-threshold" value={seuil} onChange={e => setSeuil(e.target.value)} type="number" className="field-control" />
                </div>
              </div>
              <div className="p-6 md:p-8 border-t border-outline bg-surface-container-high flex gap-4">
                <button type="button" onClick={() => setIsEditorOpen(false)} aria-label="Annuler la modification" className="flex-1 h-12 border border-outline rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-background transition-all">Annuler</button>
                <button onClick={handleSave} className="flex-[2] btn-primary h-12">
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDelete}
        title="Supprimer l'ingrédient"
        message="Voulez-vous retirer définitivement cet article du stock ?"
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};
