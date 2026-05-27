import React, { useState, useEffect, useRef } from 'react';
import { menuApi } from '../../api/menu';
import { stockApi } from '../../api/inventory_hr';
import type { Plat, Categorie } from '../../types/menu';
import type { Ingredient, PlatIngredient } from '../../types/inventory';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  Minus, 
  Search,
  Filter,
  X,
  Timer,
  ChefHat,
  Save,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const PlatPage: React.FC = () => {
  const [plats, setPlats] = useState<Plat[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [platIngredients, setPlatIngredients] = useState<PlatIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPlat, setEditingPlat] = useState<Plat | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilterCat, setActiveFilterCat] = useState<number | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Form state
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [temps, setTemps] = useState(15);
  const [selectedCat, setSelectedCat] = useState<number>(0);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Recipe Form State
  const [selectedIngredients, setSelectedIngredients] = useState<{ingredient: number, quantite: string, isNew: boolean, id?: number}[]>([]);

  // Refs for Scroll and Undo Logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingDeletions = useRef<Record<number, any>>({});

  const fetchData = async () => {
    try {
      const [platsRes, catsRes, ingredientsRes, platIngRes] = await Promise.all([
        menuApi.getPlats(),
        menuApi.getCategories(),
        stockApi.getIngredients(),
        stockApi.getPlatIngredients()
      ]);
      setPlats(platsRes.data);
      setCategories(catsRes.data);
      setAllIngredients(ingredientsRes.data);
      setPlatIngredients(platIngRes.data);
      if (catsRes.data.length > 0 && !selectedCat) {
        setSelectedCat(catsRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch plats data', err);
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
        // Cleanup all pending deletions on unmount
        Object.values(pendingDeletions.current).forEach(t => clearTimeout(t));
    };
  }, []);

  // Reset scroll on page change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [currentPage]);

  const handleOpenEditor = (plat?: Plat) => {
    if (plat) {
      setEditingPlat(plat);
      setNom(plat.nom);
      setDescription(plat.description || '');
      setPrix(plat.prix);
      setTemps(plat.temps_preparation);
      setSelectedCat(plat.categorie);
      setPreview(plat.image);
      
      const pIngs = platIngredients.filter(pi => pi.plat === plat.id);
      setSelectedIngredients(pIngs.map(pi => ({
        id: pi.id,
        ingredient: pi.ingredient,
        quantite: pi.quantite_requise,
        isNew: false
      })));
    } else {
      setEditingPlat(null);
      setNom('');
      setDescription('');
      setPrix('');
      setTemps(15);
      if (categories.length > 0) setSelectedCat(categories[0].id);
      setPreview(null);
      setSelectedIngredients([]);
    }
    setImage(null);
    setIsEditorOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const addIngredientRow = () => {
    if (allIngredients.length > 0) {
      setSelectedIngredients([...selectedIngredients, { ingredient: allIngredients[0].id, quantite: '0', isNew: true }]);
    }
  };

  const updateIngredientRow = (index: number, field: string, value: any) => {
    const newItems = [...selectedIngredients];
    newItems[index] = { ...newItems[index], [field]: value };
    setSelectedIngredients(newItems);
  };

  const removeIngredientRow = async (index: number) => {
    const item = selectedIngredients[index];
    if (!item.isNew && item.id) {
        try {
            await stockApi.deletePlatIngredient(item.id);
        } catch (e) {
            console.error(e);
        }
    }
    const newItems = [...selectedIngredients];
    newItems.splice(index, 1);
    setSelectedIngredients(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData();
    formData.append('nom', nom);
    formData.append('description', description);
    formData.append('prix', prix);
    formData.append('temps_preparation', temps.toString());
    formData.append('categorie', selectedCat.toString());
    formData.append('est_active', String(editingPlat?.est_active ?? true));
    formData.append('est_disponible', String(editingPlat?.est_disponible ?? true));
    if (image) formData.append('image', image);

    try {
      let platId = editingPlat?.id;
      if (editingPlat) {
        await menuApi.updatePlat(editingPlat.id, formData);
      } else {
        const res = await menuApi.createPlat(formData);
        platId = res.data.id;
      }
      
      if (platId) {
        for (const item of selectedIngredients) {
            if (item.isNew) {
                await stockApi.createPlatIngredient({
                    plat: platId,
                    ingredient: item.ingredient,
                    quantite_requise: item.quantite
                });
            } else if (item.id) {
                await stockApi.updatePlatIngredient(item.id, {
                    ingredient: item.ingredient,
                    quantite_requise: item.quantite
                });
            }
        }
      }

      toast.success('Création enregistrée');
      setIsEditorOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Échec de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const platToDelete = plats.find(p => p.id === id);
    if (!platToDelete) return;

    // 1. Optimistic removal from UI
    setPlats(prev => prev.filter(p => p.id !== id));

    try {
        await menuApi.deletePlat(id);
        
        toast.warning(`Plat "${platToDelete.nom}" supprimé`, {
            duration: 10000,
            action: {
                label: 'ANNULER',
                onClick: async () => {
                    try {
                        const formData = new FormData();
                        formData.append('est_active', 'true');
                        await menuApi.updatePlat(id, formData);
                        fetchData();
                        toast.success('Suppression annulée');
                    } catch (restoreErr) {
                        toast.error('Échec de la restauration');
                        setPlats(prev => [...prev, platToDelete].sort((a, b) => a.nom.localeCompare(b.nom)));
                    }
                }
            }
        });
    } catch (err) {
        toast.error(`Échec de suppression pour ${platToDelete.nom}`);
        setPlats(prev => [...prev, platToDelete].sort((a, b) => a.nom.localeCompare(b.nom)));
    }
  };

  const toggleAvailability = async (plat: Plat) => {
      try {
          const formData = new FormData();
          formData.append('est_disponible', String(!plat.est_disponible));
          await menuApi.updatePlat(plat.id, formData);
          toast.success(plat.est_disponible ? 'ARTICLE ÉPUISÉ (86)' : 'ARTICLE RÉAPPROVISIONNÉ');
          fetchData();
      } catch (e) {
          toast.error('Échec du changement de statut');
      }
  };

  const getCategoryName = (id: number) => {
    return categories.find(c => c.id === id)?.nom || 'Non classé';
  };

  const filteredPlats = plats.filter(p => 
    (activeFilterCat === null || p.categorie === activeFilterCat) &&
    (p.nom.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredPlats.length / itemsPerPage);
  const paginatedPlats = filteredPlats.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/></div>;

  return (
    <div className="h-full flex flex-col -m-4 bg-surface-main overflow-hidden font-body selection:bg-primary/20">
      
      {/* Page Header */}
      <header className="flex-none flex items-end justify-between px-staff-margin py-unit-lg border-b border-outline-variant bg-surface-main">
        <div>
          <h1 className="font-serif text-3xl font-black text-on-surface tracking-tighter uppercase">Opérations Menu</h1>
          <h2 className="sr-only">Plats</h2>
          <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-1">Registre opérationnel des créations actives</p>
        </div>
        <div className="flex gap-unit-md items-center">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="text"
              placeholder="RECHERCHER..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-48 h-10 bg-surface-container-low border border-outline-variant pl-10 pr-4 rounded-lg font-sans text-[10px] font-bold text-on-surface focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/30"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <select 
              value={activeFilterCat || ''} 
              onChange={(e) => { setActiveFilterCat(e.target.value ? parseInt(e.target.value) : null); setCurrentPage(1); }}
              className="h-10 bg-surface-container-low border border-outline-variant rounded-lg px-3 text-[10px] font-black uppercase tracking-widest min-w-[140px]"
            >
              <option value="">TOUTES CATÉGORIES</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nom.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => handleOpenEditor()}
            data-testid="plat-create-button"
            className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded-lg font-sans text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all border border-primary"
          >
            <Plus className="w-4 h-4" /> Ajouter Plat
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col p-staff-margin bg-surface-container-lowest">
        
        {/* Ledger Grid (Dense Table) */}
        <div className="flex-1 bg-surface-main border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-2xl">
          {/* Grid Header */}
          <div className="grid grid-cols-[64px_2fr_1fr_1fr_100px_80px] gap-unit-md px-6 py-4 bg-surface-container border-b border-outline-variant font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] items-center">
            <div>Ref</div>
            <div className="truncate">Plat & Détails Techniques</div>
            <div>Catégorie</div>
            <div className="flex justify-center">Prix Marché DH</div>
            <div className="flex justify-center">Ops Direct</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Grid Rows - Scrollable Section */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-outline-variant/30 scroll-smooth"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="flex flex-col divide-y divide-outline-variant/30"
              >
                {paginatedPlats.map((plat) => (
                  <div 
                    key={plat.id}
                    data-testid={`plat-card-${plat.id}`}
                    className="grid grid-cols-[64px_2fr_1fr_1fr_100px_80px] gap-unit-md px-6 py-4 items-center group hover:bg-surface-container-low transition-colors"
                  >
                    {/* Image/Ref */}
                    <div className="w-11 h-11 bg-surface-container-lowest border border-outline-variant rounded overflow-hidden relative shadow-inner">
                      {plat.image ? (
                        <img src={plat.image} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" alt={plat.nom} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-on-surface-variant/20 font-serif italic font-black text-xl">{plat.nom.charAt(0)}</div>
                      )}
                    </div>

                    {/* Name & Details */}
                    <div className="min-w-0 pr-4">
                      <h3 className="font-sans text-[14px] font-black text-on-surface uppercase tracking-tight truncate group-hover:text-primary transition-colors">{plat.nom}</h3>
                      <p className="font-sans text-[10px] text-on-surface-variant uppercase tracking-widest mt-1 line-clamp-1">{plat.description || 'AUCUN CONTEXTE'}</p>
                    </div>

                    {/* Category */}
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-sm bg-surface-container-highest border border-outline-variant/50 text-on-surface-variant font-sans text-[9px] font-black uppercase tracking-widest">
                        {getCategoryName(plat.categorie)}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex justify-center font-sans text-[15px] font-black text-primary tabular-nums">
                      {parseFloat(plat.prix).toFixed(0)}
                    </div>

                    {/* Availability Toggle */}
                    <div className="flex justify-center">
                      <button 
                        type="button"
                        onClick={() => toggleAvailability(plat)}
                        aria-label={`${plat.est_disponible ? 'Désactiver' : 'Activer'} la disponibilité pour ${plat.nom}`}
                        aria-pressed={plat.est_disponible}
                        title={`${plat.est_disponible ? 'Désactiver' : 'Activer'} la disponibilité pour ${plat.nom}`}
                        className={`w-10 h-5 rounded-full relative transition-all border ${plat.est_disponible ? 'bg-primary border-primary' : 'bg-surface-container-highest border-outline-variant'}`}
                      >
                        <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${plat.est_disponible ? 'right-0.5' : 'left-0.5'}`} />
                        <span className="sr-only">
                          {plat.est_disponible ? 'Disponible' : 'Indisponible'} : {plat.nom}
                        </span>
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        type="button"
                        data-testid={`plat-edit-${plat.id}`}
                        onClick={() => handleOpenEditor(plat)}
                        aria-label={`Modifier le plat ${plat.nom}`}
                        title={`Modifier le plat ${plat.nom}`}
                        className="p-2 rounded hover:bg-primary/10 hover:text-primary transition-all active:scale-75"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="sr-only">Modifier {plat.nom}</span>
                      </button>
                      <button
                        type="button"
                        data-testid={`plat-delete-${plat.id}`}
                        onClick={() => handleDelete(plat.id)}
                        aria-label={`Supprimer le plat ${plat.nom}`}
                        title={`Supprimer le plat ${plat.nom}`}
                        className="p-2 rounded hover:bg-error/10 hover:text-error transition-all active:scale-75"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Supprimer {plat.nom}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Pagination - Centered */}
          <div className="flex-none px-6 py-3 border-t border-outline-variant bg-surface-container flex justify-center items-center font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
            {/* Pagination Controls */}
            {totalPages > 1 ? (
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 hover:text-primary disabled:opacity-20 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1.5 bg-surface-container-highest px-4 py-1 rounded-full border border-outline-variant/30">
                        <span className="text-primary">{currentPage}</span>
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
                <span className="opacity-20 tracking-[0.5em]">FIN DU CATALOGUE</span>
            )}
          </div>
        </div>
      </main>

      {/* Slide-over Editor */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-xl h-full bg-surface-container-low border-l border-outline-variant shadow-2xl flex flex-col"
            >
              <div className="flex-none flex items-center justify-between p-6 border-b border-outline-variant bg-surface-main">
                <div>
                  <h2 className="font-serif text-2xl font-black text-on-surface uppercase tracking-tight">{editingPlat ? 'Modifier Création' : 'Nouvelle Création'}</h2>
                  <p className="font-sans text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mt-1">Registre des Dossiers Culinaires</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  data-testid="close-editor"
                  aria-label="Fermer l'éditeur de plat"
                  title="Fermer l'éditeur de plat"
                  className="p-2 rounded hover:bg-surface-container-high transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-unit-lg">
                <div className="grid grid-cols-2 gap-unit-md">
                   <div className="col-span-2 space-y-unit-xs">
                      <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Nomenclature du Plat</label>
                      <input 
                        type="text" required value={nom} onChange={(e) => setNom(e.target.value)}
                        data-testid="plat-name-input"
                        className="w-full h-12 px-4 bg-surface-main border border-outline-variant rounded font-sans font-bold text-on-surface focus:border-primary outline-none transition-all uppercase"
                      />
                   </div>

                   <div className="space-y-unit-xs">
                      <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Allocation Secteur</label>
                      <select 
                        value={selectedCat} onChange={(e) => setSelectedCat(parseInt(e.target.value))}
                        className="w-full"
                      >
                        {categories.map(c => <option key={c.id} value={c.id}>{c.nom.toUpperCase()}</option>)}
                      </select>
                   </div>

                   <div className="space-y-unit-xs">
                      <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Valeur (DH)</label>
                      <input 
                        type="text" required value={prix} onChange={(e) => setPrix(e.target.value)}
                        data-testid="plat-price-input"
                        className="w-full h-12 px-4 bg-surface-main border border-outline-variant rounded font-sans font-bold text-on-surface focus:border-primary outline-none transition-all tabular-nums"
                      />
                   </div>
                </div>

                <div className="space-y-unit-xs">
                  <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Récit Culinaire / Mémo</label>
                  <textarea 
                    rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                    data-testid="plat-description-input"
                    className="w-full p-4 bg-surface-main border border-outline-variant rounded font-sans text-[13px] font-bold text-on-surface focus:border-primary outline-none transition-all resize-none uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-unit-md">
                   <div className="space-y-unit-xs">
                      <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Vitesse de Prép. (MIN)</label>
                      <div className="relative">
                        <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/30" />
                        <input 
                          type="number" value={temps} onChange={(e) => setTemps(parseInt(e.target.value) || 15)}
                          data-testid="plat-time-input"
                          className="w-full h-12 pl-10 pr-4 bg-surface-main border border-outline-variant rounded font-mono font-bold text-on-surface focus:border-primary outline-none transition-all"
                        />
                      </div>
                   </div>
                   <div className="space-y-unit-xs">
                      <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Ressource Visuelle</label>
                      <div className="relative group h-12 bg-surface-main border border-dashed border-outline-variant rounded flex items-center justify-center overflow-hidden transition-all hover:border-primary cursor-pointer">
                        {preview ? <span className="font-sans text-[10px] font-black text-primary">FICHIER CHARGÉ</span> : <span className="font-sans text-[10px] font-bold text-on-surface-variant/40">INJECTER IMAGE</span>}
                        <input
                          type="file"
                          data-testid="plat-image-input"
                          onChange={handleImageChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                   </div>
                </div>

                {/* Recipe/Ingredients - Technical Grid */}
                <div className="pt-6 border-t border-outline-variant/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="font-sans text-[11px] font-black text-on-surface uppercase tracking-widest">Liens Recette Technique</label>
                    <button type="button" onClick={addIngredientRow} className="px-3 py-1 bg-surface-container-high border border-outline-variant rounded font-sans text-[9px] font-black flex items-center gap-1.5 hover:bg-primary hover:text-on-primary transition-all">
                      <Plus className="w-3 h-3" /> LIER COMPOSANT
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedIngredients.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center bg-surface-container-lowest p-2 border border-outline-variant/30 rounded">
                        <select 
                          value={item.ingredient} onChange={(e) => updateIngredientRow(index, 'ingredient', parseInt(e.target.value))}
                          className="flex-1 bg-transparent border-none font-sans text-[12px] font-bold text-on-surface focus:ring-0 uppercase"
                        >
                          {allIngredients.map(ing => <option key={ing.id} value={ing.id}>{ing.nom}</option>)}
                        </select>
                        <input 
                          type="number" step="0.01" value={item.quantite} onChange={(e) => updateIngredientRow(index, 'quantite', e.target.value)}
                          className="w-20 bg-surface-main border border-outline-variant rounded px-2 py-1 font-mono text-[12px] font-bold text-center"
                        />
                        <button type="button" onClick={() => removeIngredientRow(index)} className="p-1.5 hover:text-error transition-colors"><Minus className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {selectedIngredients.length === 0 && (
                      <div className="py-8 border border-dashed border-outline-variant/20 rounded flex flex-col items-center justify-center text-on-surface-variant/20 gap-2">
                        <ChefHat className="w-8 h-8 stroke-[1]" />
                        <span className="font-sans text-[9px] font-black uppercase tracking-[0.2em]">Pas de déductions automatisées</span>
                      </div>
                    )}
                  </div>
                </div>
              </form>

              <div className="flex-none p-6 border-t border-outline-variant bg-surface-main flex gap-4">
                <button type="button" onClick={() => setIsEditorOpen(false)} className="flex-1 h-14 border border-outline-variant rounded font-sans text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant hover:bg-surface-container-high transition-all">Annuler</button>
                <button 
                  onClick={handleSubmit} disabled={isSaving}
                  data-testid="plat-save-button"
                  className="flex-[2] h-14 bg-primary text-on-primary rounded font-sans text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-primary"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /><span>Enregistrer</span></>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
