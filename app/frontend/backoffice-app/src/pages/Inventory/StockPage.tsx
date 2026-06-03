import React, { useState, useEffect } from 'react';
import { stockApi } from '../../api/inventory_hr';
import type { Ingredient } from '../../types/inventory';
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Download,
  Search
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export const StockPage: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [search, setSearch] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [, setItemToDelete] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [nom, setNom] = useState('');
  const [unite, setUnite] = useState<'g' | 'ml' | 'pcs'>('g');
  const [stock, setStock] = useState('0');
  const [seuil, setSeuil] = useState('0');

  const fetchStock = async () => {
    try {
      const res = await stockApi.getIngredients();
      setIngredients(res.data);
    } catch (err) {
      console.error('Failed to fetch stock', err);
      toast.error('Erreur chargement inventaire');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

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

  const handleExportCSV = () => {
    try {
      if (ingredients.length === 0) return;
      const headers = ['ID', 'DESIGNATION', 'UNIT', 'STOCK', 'SEUIL', 'STATUS'];
      const rows = ingredients.map(i => [i.id, i.nom.toUpperCase(), i.unite_mesure.toUpperCase(), i.stock_actuel, i.seuil_alerte]);
      const csvContent = '﻿' + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'STOCK_TASTIFY.csv');
      link.click();
    } catch (err) {
      toast.error('ERREUR EXPORT');
    }
  };

  const filteredIngredients = ingredients.filter(i =>
    i.est_active && i.nom.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedIngredients = filteredIngredients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isLoading) return <div className="h-full flex items-center justify-center text-on-background"><Loader2 className="w-8 h-8 animate-spin" strokeWidth={1}/></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-body selection:bg-on-background/10 overflow-hidden">
      <header className="flex-none flex justify-between items-center px-8 h-20 border-b border-outline bg-surface">
        <div>
          <h1 aria-label="Inventory & Logistics" className="text-sm font-bold tracking-widest text-on-background uppercase">Stock & Logistique</h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-40">Approvisionnement et inventaire global</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-on-background transition-colors" />
            <input
              type="text"
              placeholder="RESOURCE LOOKUP..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-48 h-10 bg-background border border-outline pl-10 pr-4 rounded text-[10px] font-bold text-on-background focus:border-on-background outline-none transition-all uppercase placeholder:text-on-surface-variant/30"
            />
          </div>
          <button onClick={handleExportCSV} className="btn-ghost h-10 px-4">
            <Download className="w-3.5 h-3.5" /> <span>Export CSV</span>
          </button>
          <button onClick={() => handleOpenEditor()} className="btn-primary h-10 px-6">
            <Plus className="w-4 h-4" /> <span>Add Item</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 bg-background custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedIngredients.map(i => {
            const isLow = parseFloat(i.stock_actuel) < parseFloat(i.seuil_alerte);
            return (
              <div key={i.id} className="atelier-card p-6 flex flex-col justify-between group">
                <div className="flex justify-between items-start mb-6">
                  <span className="font-mono text-[9px] opacity-40">#{i.id}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEditor(i)} className="p-1.5 hover:bg-surface-container-high rounded transition-all text-on-surface-variant"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setItemToDelete(i.id); setIsDeleteModalOpen(true); }} className="p-1.5 hover:bg-error/5 rounded transition-all text-error"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-on-background">{i.nom}</h3>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-on-background">{parseFloat(i.stock_actuel).toFixed(0)}</span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{i.unite_mesure}</span>
                  </div>
                  {isLow && (
                    <p className="mt-2 text-[9px] font-bold text-error uppercase tracking-widest">CRITICAL DEPLETION</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setIsEditorOpen(false)} />
            <div className="relative w-full max-w-md h-full bg-surface border-l border-outline flex flex-col shadow-2xl">
              <div className="p-8 border-b border-outline bg-surface-container-high">
                <h2 className="text-sm font-bold text-on-background uppercase tracking-[0.3em]">
                  {editingItem ? 'ÉDITER RESSOURCE' : 'Nouvel Item'}
                  {!editingItem && <span className="sr-only"> New Resource</span>}
                </h2>
              </div>
              <div className="p-10 space-y-8 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Désignation</label>
                  <input value={nom} onChange={e => setNom(e.target.value)} type="text" className="w-full h-12 bg-background border border-outline rounded-md px-4 font-bold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Unité</label>
                  <select value={unite} onChange={e => setUnite(e.target.value as 'g' | 'ml' | 'pcs')} className="w-full h-12 bg-background border border-outline rounded-md px-4 font-bold text-sm">
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Stock actuel</label>
                  <input value={stock} onChange={e => setStock(e.target.value)} type="number" className="w-full h-12 bg-background border border-outline rounded-md px-4 font-bold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Seuil alerte</label>
                  <input value={seuil} onChange={e => setSeuil(e.target.value)} type="number" className="w-full h-12 bg-background border border-outline rounded-md px-4 font-bold text-sm" />
                </div>
              </div>
              <div className="p-8 border-t border-outline bg-surface-container-high flex gap-4">
                <button type="button" onClick={() => setIsEditorOpen(false)} aria-label="discard" className="flex-1 h-12 border border-outline rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-background transition-all">Annuler</button>
                <button className="flex-[2] btn-primary h-12">
                  <span>Commit Record</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={fetchStock}
        title="DÉSTRUCTION RESSOURCE"
        message="Voulez-vous rayer définitivement cet article du registre logistique ?"
        confirmLabel="discard"
        variant="danger"
      />
    </div>
  );
};
