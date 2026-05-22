import React, { useState, useEffect } from 'react';
import { stockApi } from '../../api/inventory_hr';
import type { Ingredient } from '../../types/inventory';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  AlertTriangle, 
  Download, 
  Search, 
  ChevronDown,
  TrendingDown,
  Warehouse,
  History,
  X,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const StockPage: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [search, setSearch] = useState('');
  
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
      toast.error('Inventory load failed');
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
    setIsEditorOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = { nom, unite_mesure: unite, stock_actuel: stock, seuil_alerte: seuil };
    try {
      if (editingItem) {
        await stockApi.updateIngredient(editingItem.id, payload);
        toast.success('Resource record updated');
      } else {
        await stockApi.createIngredient(payload);
        toast.success('New resource registered');
      }
      setIsEditorOpen(false);
      fetchStock();
    } catch (err) {
      toast.error('Failed to commit record');
    } finally {
      setIsSaving(false);
    }
  };

  const lowStockItems = ingredients.filter(i => parseFloat(i.stock_actuel) <= parseFloat(i.seuil_alerte));
  
  const filteredIngredients = ingredients.filter(i => 
    i.est_active && i.nom.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/></div>;

  return (
    <div className="h-full flex flex-col -m-4 bg-surface-main overflow-hidden font-body selection:bg-primary/20">
      
      {/* Dynamic Header Area */}
      <header className="flex-none flex items-end justify-between px-staff-margin py-unit-lg border-b border-outline-variant bg-surface-main">
        <div>
          <h1 className="font-serif text-3xl font-black text-on-surface tracking-tighter uppercase">Inventory & Logistics</h1>
          <h2 className="sr-only">Stock</h2>
          <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-1">Real-time supply chain monitoring</p>
        </div>
        <div className="flex gap-unit-md items-center">
          <div className="relative group mr-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="text"
              placeholder="RESOURCE LOOKUP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 h-10 bg-surface-container-low border border-outline-variant pl-10 pr-4 rounded font-sans text-[10px] font-bold text-on-surface focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/30"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded font-sans text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-all">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button 
            onClick={() => handleOpenEditor()}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded font-sans text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-staff-margin bg-surface-container-lowest custom-scrollbar space-y-staff-margin">
        
        {/* Bento Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-unit-md">
          {/* Total Units */}
          <div className="bg-surface-container border border-outline-variant rounded-lg p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
              <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Total Active Units</span>
              <Warehouse className="w-5 h-5 text-on-surface-variant/30 group-hover:text-primary transition-colors" />
            </div>
            <div className="mt-6 z-10">
              <span className="font-serif text-3xl font-black text-on-surface tabular-nums">{ingredients.length}</span>
              <span className="block font-sans text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Across primary storage</span>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
          </div>

          {/* Low Stock Alerts */}
          <div className={`bg-surface-container border border-outline-variant rounded-lg p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group ${lowStockItems.length > 0 ? 'ring-2 ring-error/20' : ''}`}>
             <div className="flex justify-between items-start z-10">
              <span className={`font-sans text-[10px] font-black uppercase tracking-widest ${lowStockItems.length > 0 ? 'text-error' : 'text-on-surface-variant'}`}>Stock Depletion Alerts</span>
              <TrendingDown className={`w-5 h-5 ${lowStockItems.length > 0 ? 'text-error animate-pulse' : 'text-on-surface-variant/30'}`} />
            </div>
            <div className="mt-6 z-10">
              <span className={`font-serif text-3xl font-black tabular-nums ${lowStockItems.length > 0 ? 'text-error' : 'text-on-surface'}`}>{lowStockItems.length}</span>
              <span className="block font-sans text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Requiring immediate restock</span>
            </div>
            {lowStockItems.length > 0 && <div className="absolute top-0 right-0 w-full h-1 bg-error/30" />}
          </div>

          {/* Value Approximation */}
          <div className="bg-surface-container border border-outline-variant rounded-lg p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
              <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Est. Inventory Value</span>
              <History className="w-5 h-5 text-on-surface-variant/30" />
            </div>
            <div className="mt-6 z-10">
              <span className="font-serif text-3xl font-black text-on-surface tabular-nums">42,850 DH</span>
              <span className="block font-sans text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Synced 2m ago</span>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-success/5 rounded-full blur-2xl group-hover:bg-success/10 transition-all" />
          </div>
        </div>

        {/* Tactical Data Grid */}
        <div className="bg-surface-main border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-2xl">
          {/* Toolbar */}
          <div className="p-unit-sm border-b border-outline-variant bg-surface-container flex items-center justify-between">
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-surface-container-high border border-outline-variant rounded text-on-surface font-sans text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                 Metric Group <ChevronDown className="w-3 h-3" />
              </button>
              <button className="px-3 py-1.5 bg-surface-container-high border border-outline-variant rounded text-on-surface font-sans text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                 Criticality <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mr-2">Showing {filteredIngredients.length} index points</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-outline-variant">
                  <th className="py-4 px-6 font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Resource Identifier</th>
                  <th className="py-4 px-6 font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] text-center">Unit</th>
                  <th className="py-4 px-6 font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] text-center">Quantity</th>
                  <th className="py-4 px-6 font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] text-center">Threshold</th>
                  <th className="py-4 px-6 font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Operational Status</th>
                  <th className="py-4 px-6 font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 font-sans text-[13px] font-bold text-on-surface">
                {filteredIngredients.map((item) => {
                  const isLow = parseFloat(item.stock_actuel) <= parseFloat(item.seuil_alerte);
                  return (
                    <tr key={item.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="py-4 px-6 uppercase tracking-tight font-black">{item.nom}</td>
                      <td className="py-4 px-6 text-center">
                         <span className="px-2 py-0.5 rounded-sm bg-surface-container-highest border border-outline-variant/50 text-[10px] text-on-surface-variant uppercase tracking-widest font-black">
                            {item.unite_mesure}
                         </span>
                      </td>
                      <td className={`py-4 px-6 text-center tabular-nums text-base font-black ${isLow ? 'text-error' : 'text-primary'}`}>
                        {item.stock_actuel}
                      </td>
                      <td className="py-4 px-6 text-center tabular-nums opacity-40">
                        {item.seuil_alerte}
                      </td>
                      <td className="py-4 px-6">
                        {isLow ? (
                          <div className="flex items-center gap-2 text-error font-black text-[10px] uppercase tracking-wider animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>CRITICAL DEPLETION</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-success font-black text-[10px] uppercase tracking-wider opacity-60">
                             <div className="w-1.5 h-1.5 rounded-full bg-success" />
                             <span>NOMINAL LEVEL</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => handleOpenEditor(item)} className="p-2 rounded hover:bg-primary/10 hover:text-primary transition-all active:scale-75">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded hover:bg-error/10 hover:text-error transition-all active:scale-75">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Editor Side-over */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-lg h-full bg-surface-container-low border-l border-outline-variant shadow-2xl flex flex-col"
            >
              <div className="flex-none flex items-center justify-between p-6 border-b border-outline-variant bg-surface-main">
                <div>
                  <h2 className="font-serif text-2xl font-black text-on-surface uppercase tracking-tight">{editingItem ? 'Edit Resource' : 'New Resource'}</h2>
                  <p className="font-sans text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mt-1">Resource Metric Configuration</p>
                </div>
                <button onClick={() => setIsEditorOpen(false)} className="p-2 rounded hover:bg-surface-container-high transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-unit-lg">
                <div className="space-y-unit-xs">
                  <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Resource Nomenclature</label>
                  <input 
                    type="text" required value={nom} onChange={(e) => setNom(e.target.value)}
                    className="w-full h-12 px-4 bg-surface-main border border-outline-variant rounded font-sans font-bold text-on-surface focus:border-primary outline-none transition-all uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-unit-md">
                   <div className="space-y-unit-xs">
                      <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Metric Unit</label>
                      <select 
                        value={unite} onChange={(e) => setUnite(e.target.value as any)}
                        className="w-full h-12 px-4 bg-surface-main border border-outline-variant rounded font-sans font-bold text-on-surface focus:border-primary outline-none transition-all"
                      >
                        <option value="g">GRAMS (G)</option>
                        <option value="ml">MILLILITERS (ML)</option>
                        <option value="pcs">PIECES (PCS)</option>
                      </select>
                   </div>
                   <div className="space-y-unit-xs">
                      <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Initial Balance</label>
                      <input 
                        type="number" step="0.01" value={stock} onChange={(e) => setStock(e.target.value)}
                        className="w-full h-12 px-4 bg-surface-main border border-outline-variant rounded font-mono font-bold text-on-surface focus:border-primary outline-none transition-all tabular-nums"
                      />
                   </div>
                </div>

                <div className="space-y-unit-xs">
                  <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Critical Alert Threshold</label>
                  <div className="relative">
                    <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-error opacity-40" />
                    <input 
                      type="number" step="0.01" value={seuil} onChange={(e) => setSeuil(e.target.value)}
                      className="w-full h-12 pl-10 pr-4 bg-surface-main border border-outline-variant rounded font-mono font-bold text-on-surface focus:border-error outline-none transition-all tabular-nums"
                    />
                  </div>
                  <p className="font-sans text-[9px] text-on-surface-variant uppercase mt-2 tracking-wider">System will flag the resource when balance drops below this point.</p>
                </div>
              </form>

              <div className="flex-none p-6 border-t border-outline-variant bg-surface-main flex gap-4">
                <button type="button" onClick={() => setIsEditorOpen(false)} className="flex-1 h-14 border border-outline-variant rounded font-sans text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant hover:bg-surface-container-high transition-all">Discard</button>
                <button 
                  onClick={handleSubmit} disabled={isSaving}
                  className="flex-[2] h-14 bg-primary text-on-primary rounded font-sans text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-primary"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /><span>Commit Record</span></>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

