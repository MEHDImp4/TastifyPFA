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
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-display-lg text-[32px] text-on-surface leading-none">Inventory & Logistics</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-secondary"></div>
            <span className="text-ui-data-dense uppercase tracking-widest text-on-surface-variant font-bold">Supply Chain & Resource Monitoring</span>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-3 px-6 py-3 bg-primary text-on-primary border-2 border-on-surface text-ui-button font-ui-button shadow-[4px_4px_0px_#301400] transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#301400] active:translate-y-[2px] active:shadow-none"
        >
          <Plus className="w-5 h-5"  strokeWidth={2.5}/>
          <span>NEW STOCK UNIT</span>
        </button>
      </div>

      {isLoading ? (
        <div className="bg-surface-container border-2 border-on-surface p-6 space-y-4 shadow-[6px_6px_0px_#301400]">
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
        </div>
      ) : (
        <div className="bg-surface-container border-2 border-on-surface overflow-hidden shadow-[8px_8px_0px_#301400]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-on-surface text-background">
                <th className="px-6 py-3 text-ui-label-bold text-[10px]">RESOURCE IDENTIFIER</th>
                <th className="px-6 py-3 text-ui-label-bold text-[10px] text-center">METRIC</th>
                <th className="px-6 py-3 text-ui-label-bold text-[10px] text-center">QUANTITY</th>
                <th className="px-6 py-3 text-ui-label-bold text-[10px] text-center">THRESHOLD</th>
                <th className="px-6 py-3 text-ui-label-bold text-[10px]">STATUS</th>
                <th className="px-6 py-3 text-ui-label-bold text-[10px] text-right">OPERATIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-on-surface/5">
              {ingredients.filter(i => i.est_active).map((item) => {
                const isLow = parseFloat(item.stock_actuel) <= parseFloat(item.seuil_alerte);
                return (
                  <tr key={item.id} className="hover:bg-background transition-colors group">
                    <td className="px-6 py-4 text-ui-label-bold text-sm text-on-surface">{item.nom.toUpperCase()}</td>
                    <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-surface-container-highest border border-on-surface/10 text-ui-data-dense font-black text-on-surface-variant">
                            {item.unite_mesure.toUpperCase()}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-center text-ui-data-dense font-black text-on-surface text-base">{item.stock_actuel}</td>
                    <td className="px-6 py-4 text-center text-ui-data-dense font-black text-on-surface-variant opacity-60">{item.seuil_alerte}</td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <div className="flex items-center gap-2 text-error font-black text-[10px] uppercase tracking-widest animate-pulse bg-error/10 px-3 py-1 border border-error w-fit">
                          <AlertTriangle className="w-3.5 h-3.5"  strokeWidth={2.5}/>
                          <span>CRITICAL LOW</span>
                        </div>
                      ) : (
                        <span className="text-secondary font-black text-[10px] uppercase tracking-widest border border-secondary px-3 py-1 w-fit">NOMINAL</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-150">
                        <button onClick={() => handleOpenModal(item)} className="p-2 border-2 border-transparent hover:border-primary text-primary transition-all"><Edit2 className="w-4 h-4"  strokeWidth={2.5}/></button>
                        <button className="p-2 border-2 border-transparent hover:border-error text-error transition-all"><Trash2 className="w-4 h-4"  strokeWidth={2.5}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'EDIT RESOURCE' : 'NEW RESOURCE'}>
        <form onSubmit={handleSubmit} className="space-y-6 p-2">
          <div className="space-y-2">
            <label className="text-ui-label-bold text-[10px] text-on-surface-variant">RESOURCE NAME</label>
            <input 
                type="text" 
                required 
                value={nom} 
                onChange={(e) => setNom(e.target.value)} 
                className="w-full bg-background border-2 border-on-surface px-4 py-3 text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all uppercase" 
                placeholder="E.G. ORGANIC SAFFRON"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-ui-label-bold text-[10px] text-on-surface-variant">MEASURE UNIT</label>
                <select 
                    value={unite} 
                    onChange={(e) => setUnite(e.target.value as any)} 
                    className="w-full bg-background border-2 border-on-surface px-4 py-3 text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all"
                >
                    <option value="g">GRAMS (G)</option>
                    <option value="ml">MILLILITERS (ML)</option>
                    <option value="pcs">PIECES (PCS)</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-ui-label-bold text-[10px] text-on-surface-variant">CURRENT STOCK</label>
                <input 
                    type="number" 
                    step="0.01" 
                    value={stock} 
                    onChange={(e) => setStock(e.target.value)} 
                    className="w-full bg-background border-2 border-on-surface px-4 py-3 text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all" 
                />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-ui-label-bold text-[10px] text-on-surface-variant">CRITICAL THRESHOLD</label>
            <input 
                type="number" 
                step="0.01" 
                value={seuil} 
                onChange={(e) => setSeuil(e.target.value)} 
                className="w-full bg-background border-2 border-on-surface px-4 py-3 text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all" 
            />
          </div>
          <button 
            type="submit" 
            disabled={isSaving} 
            className="w-full py-4 bg-primary text-on-primary border-2 border-on-surface text-ui-button font-ui-button shadow-[4px_4px_0px_#301400] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#301400] transition-all active:translate-y-[2px] active:shadow-none mt-4"
          >
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin mx-auto"  strokeWidth={2.5}/> : 'COMMIT RESOURCE'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
