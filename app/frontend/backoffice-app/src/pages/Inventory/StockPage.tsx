import React, { useState, useEffect } from 'react';
import { stockApi, Ingredient } from '../../api/inventory_hr';
import { Plus, Edit2, Trash2, Loader2, Package, AlertTriangle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

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
          <h1 className="text-3xl font-bold tracking-tight">Gestion du Stock</h1>
          <p className="text-gray-400 mt-1">Suivez vos ingrédients et recevez des alertes de réapprovisionnement.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal text-white rounded-xl font-medium transition-transform hover:brightness-110 active:scale-95 shadow-lg shadow-teal/20"
        >
          <Plus className="w-5 h-5" />
          Nouvel ingrédient
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal" />
        </div>
      ) : (
        <div className="bg-dark-surface rounded-[2rem] border border-white/10 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Ingrédient</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-center">Unité</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-center">Stock Actuel</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-center">Seuil d'alerte</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Statut</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ingredients.filter(i => i.est_active).map((item) => {
                const isLow = parseFloat(item.stock_actuel) <= parseFloat(item.seuil_alerte);
                return (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-bold text-white">{item.nom}</td>
                    <td className="px-6 py-4 text-center"><span className="px-2 py-1 bg-white/5 rounded-lg text-xs font-mono">{item.unite_mesure}</span></td>
                    <td className="px-6 py-4 text-center font-mono font-bold">{item.stock_actuel}</td>
                    <td className="px-6 py-4 text-center font-mono text-gray-500">{item.seuil_alerte}</td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <div className="flex items-center gap-1.5 text-orange font-bold text-xs uppercase tracking-wider animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Réappro</span>
                        </div>
                      ) : (
                        <span className="text-teal font-bold text-xs uppercase tracking-wider">OK</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(item)} className="p-2 hover:text-teal"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-2 hover:text-terracotta"><Trash2 className="w-4 h-4" /></button>
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
            <label className="text-sm font-medium text-gray-400">Nom de l'ingrédient</label>
            <input type="text" required value={nom} onChange={(e) => setNom(e.target.value)} className="w-full bg-[#1a323b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Unité</label>
                <select value={unite} onChange={(e) => setUnite(e.target.value as any)} className="w-full bg-[#1a323b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal">
                    <option value="g">Grammes (g)</option>
                    <option value="ml">Millilitres (ml)</option>
                    <option value="pcs">Pièces (pcs)</option>
                </select>
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Stock Actuel</label>
                <input type="number" step="0.01" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full bg-[#1a323b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-400">Seuil d'alerte</label>
            <input type="number" step="0.01" value={seuil} onChange={(e) => setSeuil(e.target.value)} className="w-full bg-[#1a323b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal" />
          </div>
          <button type="submit" disabled={isSaving} className="w-full py-4 bg-teal text-white rounded-xl font-bold transition-transform active:scale-95 disabled:opacity-50">
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enregistrer'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
