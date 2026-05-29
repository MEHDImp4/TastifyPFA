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
  X, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  PackagePlus,
  Hash,
  Activity,
  Warehouse
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export const StockPage: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Form State
  const [nom, setNom] = useState('');
  const [unite, setUnite] = useState<'g' | 'ml' | 'pcs'>('g');
  const [stock, setStock] = useState('0');
  const [seuil, setSeuil] = useState('0');
  const [isSaving, setIsSaving] = useState(false);

  // Adjustment Modal State
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [adjustmentItem, setAdjustmentItem] = useState<Ingredient | null>(null);
  const [adjAmount, setAdjAmount] = useState('10');
  const [adjSource, setAdjSource] = useState('LIVRAISON');
  const [adjComment, setAdjComment] = useState('');
  const [isAdjSaving, setIsAdjSaving] = useState(false);

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

  const handleOpenAdjustment = (item: Ingredient) => {
    setAdjustmentItem(item);
    setAdjAmount('10');
    setAdjSource('LIVRAISON');
    setAdjComment('');
    setIsAdjustmentOpen(true);
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentItem) return;
    setIsAdjSaving(true);
    try {
        await stockApi.createMouvement({
            ingredient: adjustmentItem.id,
            quantite: adjAmount,
            type_mouvement: 'ENTREE',
            source: adjSource,
            commentaire: adjComment
        });
        toast.success(`RÉAPPROVISIONNEMENT : +${adjAmount} ${adjustmentItem.unite_mesure.toUpperCase()}`);
        setIsAdjustmentOpen(false);
        fetchStock();
    } catch (err) {
        toast.error('ÉCHEC OPÉRATION');
    } finally {
        setIsAdjSaving(false);
    }
  };

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
        toast.success('RESSOURCE MISE À JOUR');
      } else {
        await stockApi.createIngredient(payload);
        toast.success('NOUVELLE UNITÉ ENREGISTRÉE');
      }
      setIsEditorOpen(false);
      fetchStock();
    } catch (err) {
      toast.error('ÉCHEC SAUVEGARDE');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (id: number) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
        await stockApi.deleteIngredient(itemToDelete);
        toast.success('UNITÉ RETIRÉE DU REGISTRE');
        fetchStock();
    } catch (err) {
        toast.error('ÉCHEC SUPPRESSION');
    }
    setItemToDelete(null);
  };

  const handleExportCSV = () => {
    try {
        if (ingredients.length === 0) return;
        const reportTitle = "MANIFESTE D'INVENTAIRE TASTIFY OS";
        const exportDate = new Date().toLocaleString('fr-FR');
        const headers = ["ID", "DESIGNATION", "UNIT", "STOCK", "SEUIL", "STATUS"];
        const rows = ingredients.map(i => {
            const isLow = parseFloat(i.stock_actuel) <= parseFloat(i.seuil_alerte);
            return [i.id, i.nom.toUpperCase(), i.unite_mesure.toUpperCase(), i.stock_actuel, i.seuil_alerte, isLow ? "CRITIQUE" : "NOMINAL"];
        });
        const csvContent = "\uFEFF" + [`"${reportTitle}"`, `"Genere: ${exportDate}"`, "", headers.join(";"), ...rows.map(row => row.join(";"))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `TASTIFY_INVENTORY_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        toast.success("MANIFESTE EXPORTÉ");
    } catch (err) {
        toast.error("ERREUR EXPORT");
    }
  };

  const filteredIngredients = ingredients.filter(i => 
    i.est_active && i.nom.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = ingredients.filter(i => parseFloat(i.stock_actuel) <= parseFloat(i.seuil_alerte)).length;
  const totalPages = Math.ceil(filteredIngredients.length / itemsPerPage);
  const paginatedIngredients = filteredIngredients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-sans selection:bg-primary/20 overflow-hidden">
      
      {/* Logistics Header */}
      <div className="flex-none flex justify-between items-end px-8 py-8 border-b border-outline bg-surface-container-lowest">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-on-surface uppercase italic leading-none">Registre Logistique <span className="sr-only">Inventory & Logistics</span></h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.4em] mt-3 opacity-50">Gestion de la Chaîne d'Approvisionnement et des Stocks</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="FILTRER RESSOURCE..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-64 h-12 bg-surface-container-low border border-outline pl-12 pr-4 rounded-lg text-[10px] font-bold text-on-surface focus:border-primary outline-none transition-all uppercase placeholder:text-on-surface-variant/30"
            />
          </div>
          <button onClick={handleExportCSV} className="h-12 px-6 border border-outline rounded-lg text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all">
             <Download className="w-4 h-4 inline-block mr-2" /> Rapport CSV
          </button>
          <button onClick={() => handleOpenEditor()} className="btn-primary">
            <Plus className="w-4 h-4" strokeWidth={3} /> Nouvelle Unité
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-8 min-h-0">
        
        {/* Top Operational KPI Bar */}
        <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-surface-container-lowest border border-outline rounded-xl p-6 flex justify-between items-center">
                <div>
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Total Ressources</span>
                    <p className="text-3xl font-black text-on-surface mt-1">{ingredients.length}</p>
                </div>
                <Warehouse className="w-10 h-10 text-on-surface-variant/20" />
            </div>
            <div className={`bg-surface-container-lowest border rounded-xl p-6 flex justify-between items-center transition-all ${lowStockCount > 0 ? 'border-error/40 bg-error/[0.02]' : 'border-outline'}`}>
                <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${lowStockCount > 0 ? 'text-error' : 'text-on-surface-variant'}`}>Alertes Rupture</span>
                    <p className={`text-3xl font-black mt-1 ${lowStockCount > 0 ? 'text-error' : 'text-on-surface'}`}>{lowStockCount}</p>
                </div>
                <AlertTriangle className={`w-10 h-10 ${lowStockCount > 0 ? 'text-error animate-pulse' : 'text-on-surface-variant/20'}`} />
            </div>
            <div className="bg-surface-container-lowest border border-outline rounded-xl p-6 flex justify-between items-center">
                <div>
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Dernière Sync</span>
                    <p className="text-3xl font-black text-on-surface mt-1">MAIN</p>
                </div>
                <Activity className="w-10 h-10 text-on-surface-variant/20" />
            </div>
        </div>

        <div className="flex-1 bg-surface-container-lowest border border-outline rounded-xl overflow-hidden flex flex-col">
          
          {/* Table Header */}
          <div className="flex-none grid grid-cols-12 gap-4 px-8 py-5 border-b border-outline bg-surface-container-low text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">
            <div className="col-span-1 flex items-center gap-2"><Hash className="w-3 h-3" /> ID</div>
            <div className="col-span-3">Désignation de la Ressource</div>
            <div className="col-span-1 text-center">Unité</div>
            <div className="col-span-2 text-center">Niveau Actuel</div>
            <div className="col-span-1 text-center">Seuil</div>
            <div className="col-span-2 text-center">Statut</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {paginatedIngredients.length > 0 ? paginatedIngredients.map((item) => {
                const isLow = parseFloat(item.stock_actuel) <= parseFloat(item.seuil_alerte);
                return (
                    <div 
                      key={item.id}
                      className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-outline-variant hover:bg-white/[0.02] transition-colors items-center group"
                    >
                      <div className="col-span-1 font-mono text-xs font-bold text-on-surface-variant/40">#{item.id.toString().padStart(4, '0')}</div>
                      <div className="col-span-3">
                        <h3 className="text-sm font-black text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors">{item.nom}</h3>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-surface-container-low border border-outline px-2 py-0.5 rounded text-on-surface-variant">{item.unite_mesure}</span>
                      </div>
                      <div className={`col-span-2 text-center font-mono text-lg font-black ${isLow ? 'text-error' : 'text-primary'}`}>
                        {item.stock_actuel}
                      </div>
                      <div className="col-span-1 text-center font-mono text-xs font-bold text-on-surface-variant/30">
                        {item.seuil_alerte}
                      </div>
                      <div className="col-span-2 flex justify-center">
                        {isLow ? (
                            <div className="flex items-center gap-2 text-error font-black text-[9px] uppercase tracking-widest bg-error/5 border border-error/20 px-3 py-1 rounded">
                                <AlertTriangle className="w-3 h-3" /> CRITIQUE
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-success font-black text-[9px] uppercase tracking-widest bg-success/5 border border-success/20 px-3 py-1 rounded opacity-60">
                                <div className="w-1.5 h-1.5 rounded-full bg-success" /> NOMINAL
                            </div>
                        )}
                      </div>
                      <div className="col-span-2 flex justify-end gap-2">
                        <button onClick={() => handleOpenAdjustment(item)} className="w-9 h-9 border border-outline rounded flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all" title="Réapprovisionnement Rapide"><PackagePlus className="w-4 h-4" /></button>
                        <button onClick={() => handleOpenEditor(item)} className="w-9 h-9 border border-outline rounded flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:border-on-surface transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => confirmDelete(item.id)} className="w-9 h-9 border border-outline rounded flex items-center justify-center text-on-surface-variant hover:text-error hover:border-error transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                );
            }) : (
                <div className="h-64 flex flex-col items-center justify-center opacity-10">
                    <Activity className="w-16 h-16 mb-4" strokeWidth={1} />
                    <p className="text-xs font-black uppercase tracking-[0.4em]">Inventaire Vide</p>
                </div>
            )}
          </div>

          {/* Table Footer */}
          <div className="flex-none px-8 py-5 border-t border-outline bg-surface-container-low flex justify-between items-center">
            <span className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest">
                Total : {filteredIngredients.length} Unités logistiques
            </span>
            {totalPages > 1 && (
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border border-outline rounded hover:bg-white/5 disabled:opacity-10 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                    <div className="flex items-center gap-2 font-mono text-xs font-black bg-background border border-outline px-4 py-2 rounded">
                        <span className="text-primary">{currentPage}</span>
                        <span className="text-on-surface-variant/30">/</span>
                        <span className="text-on-surface">{totalPages}</span>
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border border-outline rounded hover:bg-white/5 disabled:opacity-10 transition-all"><ChevronRight className="w-4 h-4" /></button>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Resource Editor Side-panel */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/80">
            <motion.aside 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="w-full max-w-xl h-full bg-surface-container-lowest border-l border-outline flex flex-col"
            >
                <div className="flex-none h-24 flex items-center justify-between px-10 border-b border-outline bg-surface-container-lowest">
                    <div>
                        <h2 className="text-2xl font-black text-on-surface italic tracking-tighter uppercase">{editingItem ? 'Configuration Unité' : 'Nouvelle Ressource'}</h2>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.3em] mt-2">Édition des Paramètres de Stock</p>
                    </div>
                    <button onClick={() => setIsEditorOpen(false)} className="p-3 bg-surface-container-high rounded-lg hover:text-primary transition-all"><X className="w-7 h-7" /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Nomenclature Technique</label>
                        <input type="text" required value={nom} onChange={(e) => setNom(e.target.value)} className="w-full h-16 px-6 bg-background border border-outline rounded-xl font-black text-2xl text-on-surface uppercase focus:border-primary" placeholder="NOM DE LA RESSOURCE" />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Système Métrique</label>
                            <select value={unite} onChange={(e) => setUnite(e.target.value as any)} className="w-full h-14 bg-background border border-outline rounded-lg text-on-surface font-bold text-xs uppercase px-4 focus:border-primary">
                                <option value="g">GRAMMES (G)</option>
                                <option value="ml">MILLILITRES (ML)</option>
                                <option value="pcs">PIÈCES (PCS)</option>
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Solde Initial</label>
                            <input type="number" step="0.01" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full h-14 px-6 bg-background border border-outline rounded-lg font-mono text-lg font-black text-on-surface focus:border-primary" placeholder="0.00" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-error ml-1">Seuil de Vigilance Critique</label>
                        <div className="relative">
                            <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-error opacity-40" />
                            <input type="number" step="0.01" value={seuil} onChange={(e) => setSeuil(e.target.value)} className="w-full h-16 pl-14 pr-6 bg-background border border-outline rounded-xl font-mono text-xl font-black text-error focus:border-error" />
                        </div>
                        <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase leading-relaxed tracking-widest mt-2">Le système déclenchera une alerte prioritaire dès que le solde passera sous cette limite.</p>
                    </div>
                </form>

                <div className="flex-none h-24 bg-surface-container-lowest border-t border-outline p-6 flex gap-6">
                    <button type="button" onClick={() => setIsEditorOpen(false)} className="flex-1 border border-outline rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Annuler</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="flex-[2] bg-primary text-on-primary rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Sauvegarder Unité</>}
                    </button>
                </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Stock Adjustment Modal */}
      <AnimatePresence>
        {isAdjustmentOpen && adjustmentItem && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-low border border-outline p-12 max-w-md w-full rounded-2xl">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h3 className="text-3xl font-black text-on-surface italic tracking-tighter uppercase">Réapprovisionnement</h3>
                  <p className="text-[10px] font-bold text-primary uppercase mt-2 tracking-[0.3em]">{adjustmentItem.nom}</p>
                </div>
                <button onClick={() => setIsAdjustmentOpen(false)} className="p-3 bg-surface-container-high rounded-lg hover:text-primary transition-all"><X className="w-7 h-7" /></button>
              </div>

              <form onSubmit={handleAdjustmentSubmit} className="space-y-10">
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">Quantité Entrante ({adjustmentItem.unite_mesure.toUpperCase()})</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 50, 100, 500].map(val => (
                      <button key={val} type="button" onClick={() => setAdjAmount(val.toString())} className={`h-10 rounded font-mono font-black text-[10px] transition-all ${adjAmount === val.toString() ? 'bg-primary text-on-primary' : 'bg-background border border-outline text-on-surface-variant/40'}`}>+{val}</button>
                    ))}
                  </div>
                  <input type="number" step="0.01" required value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} className="w-full h-20 px-6 bg-background border-2 border-primary/20 rounded-xl font-mono text-4xl font-black text-primary text-center focus:border-primary" />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">Origine / Source</label>
                  <select value={adjSource} onChange={(e) => setAdjSource(e.target.value)} className="w-full h-14 bg-background border border-outline rounded-lg text-on-surface font-bold text-xs uppercase px-4 focus:border-primary">
                    <option value="LIVRAISON">LIVRAISON FOURNISSEUR</option>
                    <option value="ACHAT_PERSONNEL">ACHAT PERSONNEL</option>
                    <option value="AJUSTEMENT_INVENTAIRE">AJUSTEMENT INVENTAIRE</option>
                  </select>
                </div>

                <button type="submit" disabled={isAdjSaving} className="w-full h-16 bg-primary text-on-primary rounded-xl font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                  {isAdjSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PackagePlus className="w-6 h-6" /><span>Confirmer Entrée</span></>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="DÉSTRUCTION RESSOURCE"
        message="Voulez-vous rayer définitivement cet article du registre logistique ?"
        confirmLabel="RÉVOQUER UNITÉ"
        variant="danger"
      />
    </div>
  );
};
