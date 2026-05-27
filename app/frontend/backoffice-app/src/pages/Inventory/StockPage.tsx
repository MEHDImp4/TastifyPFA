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
  TrendingDown,
  Warehouse,
  History,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  PackagePlus
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
  const itemsPerPage = 10;
  
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
      toast.error('Erreur de chargement de l\'inventaire');
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
        toast.success(`Approvisionnement réussi : +${adjAmount} ${adjustmentItem.unite_mesure}`);
        setIsAdjustmentOpen(false);
        fetchStock();
    } catch (err) {
        toast.error('Échec de l\'approvisionnement');
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
        toast.success('Ressource mise à jour');
      } else {
        await stockApi.createIngredient(payload);
        toast.success('Ressource enregistrée');
      }
      setIsEditorOpen(false);
      fetchStock();
    } catch (err) {
      toast.error('Échec de l\'enregistrement');
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
        toast.success('Ressource supprimée');
        fetchStock();
    } catch (err) {
        toast.error('Échec de suppression');
    }
    setItemToDelete(null);
  };

  const handleExportCSV = () => {
    try {
        if (ingredients.length === 0) {
            toast.error("Aucune donnée à exporter");
            return;
        }

        // Professional Metadata
        const reportTitle = "RAPPORT D'INVENTAIRE TASTIFY OS";
        const exportDate = new Date().toLocaleString('fr-FR');
        
        const headers = ["ID_RESSOURCE", "DÉSIGNATION", "UNITÉ", "STOCK_ACTUEL", "SEUIL_ALERTE", "ÉTAT_OPÉRATIONNEL"];
        
        const rows = ingredients.map(i => {
            const isLow = parseFloat(i.stock_actuel) <= parseFloat(i.seuil_alerte);
            return [
                `#${i.id.toString().padStart(4, '0')}`,
                i.nom.toUpperCase(),
                i.unite_mesure.toUpperCase(),
                i.stock_actuel,
                i.seuil_alerte,
                isLow ? "CRITIQUE (RÉAPPRO)" : "NOMINAL"
            ];
        });

        // Add UTF-8 BOM for Excel and metadata rows
        const csvContent = "\uFEFF" + [
            `"${reportTitle}";;;;;`,
            `"Généré le : ${exportDate}";;;;;`,
            "",
            headers.join(";"),
            ...rows.map(row => row.join(";"))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `TASTIFY_STOCK_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Export Inventaire Premium réussi");
    } catch (err) {
        console.error("CSV Export error", err);
        toast.error("Échec de l'exportation");
    }
  };

  const filteredIngredients = ingredients.filter(i => 
    i.est_active && i.nom.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = ingredients.filter(i => parseFloat(i.stock_actuel) <= parseFloat(i.seuil_alerte));
  const totalPages = Math.ceil(filteredIngredients.length / itemsPerPage);
  const paginatedIngredients = filteredIngredients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/></div>;

  return (
    <div className="h-full flex flex-col -m-4 bg-surface-main overflow-hidden font-body selection:bg-primary/20">
      
      {/* Page Header */}
      <header className="flex-none flex items-end justify-between px-staff-margin py-unit-lg border-b border-outline-variant bg-surface-main">
        <div>
          <h1 className="font-serif text-3xl font-black text-on-surface tracking-tighter uppercase">Inventaire & Logistique</h1>
          <h2 className="sr-only">Stock</h2>
          <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-1">Suivi de la chaîne d'approvisionnement en temps réel</p>
        </div>
        <div className="flex gap-unit-md items-center">
          <div className="relative group mr-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="text"
              placeholder="RECHERCHE..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-56 h-10 bg-surface-container-low border border-outline-variant pl-10 pr-4 rounded-lg font-sans text-[10px] font-bold text-on-surface focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/30"
            />
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded font-sans text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Exporter CSV
          </button>
          <button 
            onClick={() => handleOpenEditor()}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded font-sans text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" /> Ajouter Article
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-staff-margin bg-surface-container-lowest custom-scrollbar space-y-staff-margin">
        
        {/* KPI Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-unit-md">
          {/* Total Units */}
          <div className="bg-surface-container border border-outline-variant rounded-lg p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
              <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Unités Actives Totales</span>
              <Warehouse className="w-5 h-5 text-on-surface-variant/30 group-hover:text-primary transition-colors" />
            </div>
            <div className="mt-6 z-10">
              <span className="font-serif text-3xl font-black text-on-surface tabular-nums">{ingredients.length}</span>
              <span className="block font-sans text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Dans l'entrepôt principal</span>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className={`bg-surface-container border border-outline-variant rounded-lg p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group ${lowStockItems.length > 0 ? 'ring-2 ring-error/20' : ''}`}>
             <div className="flex justify-between items-start z-10">
              <span className={`font-sans text-[10px] font-black uppercase tracking-widest ${lowStockItems.length > 0 ? 'text-error' : 'text-on-surface-variant'}`}>Alertes Rupture de Stock</span>
              <TrendingDown className={`w-5 h-5 ${lowStockItems.length > 0 ? 'text-error animate-pulse' : 'text-on-surface-variant/30'}`} />
            </div>
            <div className="mt-6 z-10">
              <span className={`font-serif text-3xl font-black tabular-nums ${lowStockItems.length > 0 ? 'text-error' : 'text-on-surface'}`}>{lowStockItems.length}</span>
              <span className="block font-sans text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Nécessite réappro. immédiat</span>
            </div>
            {lowStockItems.length > 0 && <div className="absolute top-0 right-0 w-full h-1 bg-error/30" />}
          </div>

          {/* Value Approximation */}
          <div className="bg-surface-container border border-outline-variant rounded-lg p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
              <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Valeur Estimée Stock</span>
              <History className="w-5 h-5 text-on-surface-variant/30" />
            </div>
            <div className="mt-6 z-10">
              <span className="font-serif text-3xl font-black text-on-surface tabular-nums">42,850 DH</span>
              <span className="block font-sans text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Mis à jour il y a 2m</span>
            </div>
          </div>
        </div>

        {/* Tactical Data Grid */}
        <div className="bg-surface-main border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-2xl mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-outline-variant">
                  <th className="py-4 px-6 font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Identifiant Ressource</th>
                  <th className="py-4 px-6 font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] text-center">Unité</th>
                  <th className="py-4 px-6 font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] text-center">Quantité</th>
                  <th className="py-4 px-6 font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] text-center">Seuil</th>
                  <th className="py-4 px-6 font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Statut Opérationnel</th>
                  <th className="py-4 px-6 font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] text-right">Opérations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 font-sans text-[13px] font-bold text-on-surface">
                {paginatedIngredients.map((item) => {
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
                            <span>RUPTURE CRITIQUE</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-success font-black text-[10px] uppercase tracking-wider opacity-60">
                             <div className="w-1.5 h-1.5 rounded-full bg-success" />
                             <span>NIVEAU NOMINAL</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => handleOpenAdjustment(item)} 
                            className="p-2 rounded hover:bg-primary/10 text-primary transition-all active:scale-75 flex items-center gap-1.5"
                            title="Entrée de stock"
                          >
                            <PackagePlus className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Réappro</span>
                          </button>
                          <button onClick={() => handleOpenEditor(item)} className="p-2 rounded hover:bg-surface-container-high transition-all active:scale-75">
                            <Edit2 className="w-4 h-4 text-on-surface-variant" />
                          </button>
                          <button onClick={() => confirmDelete(item.id)} className="p-2 rounded hover:bg-error/10 hover:text-error transition-all active:scale-75">
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

          {/* Footer Pagination - Centered */}
          <div className="flex-none px-6 py-3 border-t border-outline-variant bg-surface-container flex justify-center items-center font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
            {totalPages > 1 ? (
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 hover:text-primary disabled:opacity-20 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1.5 bg-surface-container-highest px-4 py-1 rounded-full border border-outline-variant/30 text-on-surface">
                        <span className="text-primary font-bold">{currentPage}</span>
                        <span className="opacity-30">/</span>
                        <span>{totalPages}</span>
                    </div>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1 hover:text-primary disabled:opacity-20 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <span className="opacity-20 tracking-[0.5em]">FIN DE L'INDEX</span>
            )}
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
                  <h2 className="font-serif text-2xl font-black text-on-surface uppercase tracking-tight">{editingItem ? 'Modifier Ressource' : 'Nouvelle Ressource'}</h2>
                  <p className="font-sans text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mt-1">Configuration Métrique Ressource</p>
                </div>
                <button onClick={() => setIsEditorOpen(false)} className="p-2 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-unit-lg custom-scrollbar">
                <div className="space-y-unit-xs">
                  <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Nomenclature Ressource</label>
                  <input 
                    type="text" required value={nom} onChange={(e) => setNom(e.target.value)}
                    className="w-full h-12 px-4 bg-surface-main border border-outline-variant rounded font-sans font-bold text-on-surface focus:border-primary outline-none transition-all uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-unit-md">
                   <div className="space-y-unit-xs">
                      <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Unité Métrique</label>
                      <select 
                        value={unite} onChange={(e) => setUnite(e.target.value as any)}
                        className="w-full"
                      >
                        <option value="g">GRAMMES (G)</option>
                        <option value="ml">MILLILITRES (ML)</option>
                        <option value="pcs">PIÈCES (PCS)</option>
                      </select>
                   </div>
                   <div className="space-y-unit-xs">
                      <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Solde Initial</label>
                      <input 
                        type="number" step="0.01" value={stock} onChange={(e) => setStock(e.target.value)}
                        className="w-full h-12 px-4 bg-surface-main border border-outline-variant rounded font-mono font-bold text-on-surface focus:border-primary outline-none transition-all tabular-nums"
                      />
                   </div>
                </div>

                <div className="space-y-unit-xs">
                  <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Seuil d'Alerte Critique</label>
                  <div className="relative">
                    <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-error opacity-40" />
                    <input 
                      type="number" step="0.01" value={seuil} onChange={(e) => setSeuil(e.target.value)}
                      className="w-full h-12 pl-10 pr-4 bg-surface-main border border-outline-variant rounded font-mono font-bold text-on-surface focus:border-error outline-none transition-all tabular-nums"
                    />
                  </div>
                  <p className="font-sans text-[9px] text-on-surface-variant uppercase mt-2 tracking-wider opacity-60">Le système signalera la ressource lorsque le solde tombera en dessous de ce point.</p>
                </div>
              </form>

              <div className="flex-none p-6 border-t border-outline-variant bg-surface-main flex gap-4">
                <button type="button" onClick={() => setIsEditorOpen(false)} className="flex-1 h-14 border border-outline-variant rounded font-sans text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant hover:bg-surface-container-high transition-all">Annuler</button>
                <button 
                  onClick={handleSubmit} disabled={isSaving}
                  className="flex-[2] h-14 bg-primary text-on-primary rounded font-sans text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-primary"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /><span>Enregistrer</span></>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stock Adjustment Modal */}
      <AnimatePresence>
        {isAdjustmentOpen && adjustmentItem && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface-container rounded-xl border border-outline-variant shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant bg-surface-main flex justify-between items-center">
                <div>
                  <h3 className="font-serif text-xl font-black text-on-surface uppercase tracking-tight">Entrée de Stock</h3>
                  <p className="font-sans text-[10px] font-bold text-primary uppercase mt-1 tracking-widest">{adjustmentItem.nom}</p>
                </div>
                <button onClick={() => setIsAdjustmentOpen(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdjustmentSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                  <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Quantité à Ajouter ({adjustmentItem.unite_mesure})</label>
                  
                  {/* Quick-Add Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 50, 100, 500].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAdjAmount(val.toString())}
                        className={`py-2 rounded border font-mono font-bold text-[11px] transition-all ${adjAmount === val.toString() ? 'bg-primary text-on-primary border-primary' : 'bg-surface-main border-outline-variant hover:border-primary text-on-surface'}`}
                      >
                        +{val}
                      </button>
                    ))}
                  </div>

                  <input 
                    type="number" step="0.01" required value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)}
                    className="w-full h-14 px-4 bg-surface-main border-2 border-primary/20 rounded-lg font-mono text-2xl font-black text-primary focus:border-primary outline-none text-center transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Origine des Ressources</label>
                  <select 
                    value={adjSource} onChange={(e) => setAdjSource(e.target.value)}
                    className="w-full h-12 bg-surface-main border border-outline-variant rounded px-4 font-sans font-bold text-on-surface focus:border-primary outline-none transition-all uppercase text-[11px] tracking-wider"
                  >
                    <option value="LIVRAISON">LIVRAISON FOURNISSEUR</option>
                    <option value="ACHAT_PERSONNEL">ACHAT PERSONNEL</option>
                    <option value="AJUSTEMENT_INVENTAIRE">AJUSTEMENT INVENTAIRE</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Note Opérationnelle (Optionnel)</label>
                  <textarea 
                    rows={2} value={adjComment} onChange={(e) => setAdjComment(e.target.value)}
                    className="w-full p-4 bg-surface-main border border-outline-variant rounded font-sans text-[11px] font-bold text-on-surface focus:border-primary outline-none transition-all resize-none uppercase"
                    placeholder="EX: FACTURE #1234, PROVENANCE MARCHÉ CENTRAL..."
                  />
                </div>

                <button 
                  type="submit" disabled={isAdjSaving || parseFloat(adjAmount) <= 0}
                  className="w-full h-14 bg-primary text-on-primary rounded font-sans text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isAdjSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PackagePlus className="w-5 h-5" /><span>Confirmer Réappro</span></>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="Supprimer Ressource"
        message="Êtes-vous sûr de vouloir supprimer définitivement cet article du stock ? Cette opération peut affecter les recettes liées."
        confirmLabel="SUPPRIMER"
        variant="danger"
      />
    </div>
  );
};
