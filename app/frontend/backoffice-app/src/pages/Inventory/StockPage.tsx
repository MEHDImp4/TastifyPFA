import React, { useState, useEffect } from 'react';
import { stockApi } from '../../api/inventory_hr';
import type { Ingredient } from '../../types/inventory';
import { Plus, Edit2, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

import { TableRowSkeleton } from '../../components/ui/Skeleton';

export const StockPage: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  
  const [nom, setNom] = useState('');
  const [unite, setUnite] = useState<'g' | 'ml' | 'pcs'>('g');
  const [stock, setStock] = useState('0');
  const [seuil, setSeuil] = useState('0');
  const [isSaving, setIsSaving] = useState(false);

  const fetchStock = async () => {
    try {
      const res = await stockApi.getIngredients();
      setIngredients(res.data);
    } catch (err) {
      console.error('Failed to fetch stock', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleOpenModal = (item?: Ingredient) => {
    if (item) {
      setEditingItem(item);
      setNom(item.nom);
      setUnite(item.unite_mesure);
      setStock(item.stock_actuel);
      setSeuil(item.seuil_alerte);
    } else {
      setEditingItem(null);
      setNom('');
      setUnite('g');
      setStock('0');
      setSeuil('0');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = { nom, unite_mesure: unite, stock_actuel: stock, seuil_alerte: seuil };
    try {
      if (editingItem) {
        await stockApi.updateIngredient(editingItem.id, payload);
      } else {
        await stockApi.createIngredient(payload);
      }
      setIsModalOpen(false);
      fetchStock();
    } catch (err) {
      console.error('Failed to save ingredient', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#301400' }}>Gestion du Stock</h1>
          <p className="mt-1 font-medium" style={{ color: '#53443a' }}>Suivez vos ingrédients et recevez des alertes de réapprovisionnement.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-none font-bold transition-transform hover:brightness-110 active:scale-95 shadow-[2px_2px_0px_rgba(15,23,42,0.1)] shadow-primary/20"
        >
          <Plus className="w-5 h-5"  strokeWidth={1.5}/>
          Nouvel ingrédient
        </button>
      </div>

      {isLoading ? (
        <div className="tonal-card p-6 space-y-4">
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
        </div>
      ) : (
        <div className="tonal-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant/30">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest font-mono" style={{ color: '#53443a' }}>Ingrédient</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest font-mono text-center" style={{ color: '#53443a' }}>Unité</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest font-mono text-center" style={{ color: '#53443a' }}>Stock Actuel</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest font-mono text-center" style={{ color: '#53443a' }}>Seuil d'alerte</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest font-mono" style={{ color: '#53443a' }}>Statut</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest font-mono text-right" style={{ color: '#53443a' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {ingredients.filter(i => i.est_active).map((item) => {
                const isLow = parseFloat(item.stock_actuel) <= parseFloat(item.seuil_alerte);
                return (
                  <tr key={item.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-6 py-4 font-bold" style={{ color: '#301400' }}>{item.nom}</td>
                    <td className="px-6 py-4 text-center"><span className="px-2 py-1 bg-surface-container rounded-none text-xs font-mono font-bold" style={{ color: '#53443a' }}>{item.unite_mesure}</span></td>
                    <td className="px-6 py-4 text-center font-mono font-bold" style={{ color: '#301400' }}>{item.stock_actuel}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold" style={{ color: '#53443a' }}>{item.seuil_alerte}</td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <div className="flex items-center gap-1.5 text-error font-bold text-xs uppercase tracking-wider font-mono animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5"  strokeWidth={1.5}/>
                          <span>Réappro</span>
                        </div>
                      ) : (
                        <span className="text-primary font-bold text-xs uppercase tracking-wider font-mono">OK</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(item)} className="p-2 text-primary hover:bg-primary-container/20 rounded-none transition-colors"><Edit2 className="w-4 h-4"  strokeWidth={1.5}/></button>
                        <button className="p-2 text-error hover:bg-error-container/20 rounded-none transition-colors"><Trash2 className="w-4 h-4"  strokeWidth={1.5}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Modifier le stock' : 'Nouvel ingrédient'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold" style={{ color: '#53443a' }}>Nom de l'ingrédient</label>
            <input type="text" required value={nom} onChange={(e) => setNom(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant/30 rounded-none px-4 py-3 font-bold focus:outline-none focus:border-primary transition-colors" style={{ color: '#301400' }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold" style={{ color: '#53443a' }}>Unité</label>
                <select value={unite} onChange={(e) => setUnite(e.target.value as any)} className="w-full bg-surface-container-low border border-outline-variant/30 rounded-none px-4 py-3 font-bold focus:outline-none focus:border-primary transition-colors" style={{ color: '#301400' }}>
                    <option value="g">Grammes (g)</option>
                    <option value="ml">Millilitres (ml)</option>
                    <option value="pcs">Pièces (pcs)</option>
                </select>
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold" style={{ color: '#53443a' }}>Stock Actuel</label>
                <input type="number" step="0.01" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant/30 rounded-none px-4 py-3 font-bold focus:outline-none focus:border-primary transition-colors" style={{ color: '#301400' }} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold" style={{ color: '#53443a' }}>Seuil d'alerte</label>
            <input type="number" step="0.01" value={seuil} onChange={(e) => setSeuil(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant/30 rounded-none px-4 py-3 font-bold focus:outline-none focus:border-primary transition-colors" style={{ color: '#301400' }} />
          </div>
          <button type="submit" disabled={isSaving} className="w-full py-4 bg-primary text-on-primary rounded-none font-bold transition-transform active:scale-95 disabled:opacity-50 shadow-[2px_2px_0px_rgba(15,23,42,0.1)] shadow-primary/20">
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto"  strokeWidth={1.5}/> : 'Enregistrer'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
