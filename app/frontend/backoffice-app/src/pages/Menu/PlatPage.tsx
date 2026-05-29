import React, { useState, useEffect } from 'react';
import { menuApi } from '../../api/menu';
import { stockApi } from '../../api/inventory_hr';
import type { Plat, Categorie } from '../../types/menu';
import type { Ingredient, PlatIngredient } from '../../types/inventory';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  Search,
  Filter,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  Hash,
  Activity,
  Image as ImageIcon,
  CloudUpload
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
  const itemsPerPage = 10;
  
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
  }, []);

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

      toast.success('UNITÉ ENREGISTRÉE');
      setIsEditorOpen(false);
      fetchData();
    } catch (err) {
      toast.error('ÉCHEC SAUVEGARDE');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
        await menuApi.deletePlat(id);
        toast.success('DOSSIER CULINAIRE SUPPRIMÉ');
        fetchData();
    } catch (err) {
        toast.error('ÉCHEC DE SUPPRESSION');
    }
  };

  const toggleAvailability = async (plat: Plat) => {
      try {
          const formData = new FormData();
          formData.append('est_disponible', String(!plat.est_disponible));
          await menuApi.updatePlat(plat.id, formData);
          toast.success(plat.est_disponible ? 'ARTICLE ÉPUISÉ (86)' : 'RÉAPPROVISIONNÉ');
          fetchData();
      } catch (e) {
          toast.error('ERREUR STATUT');
      }
  };

  const getCategoryName = (id: number) => {
    return categories.find(c => c.id === id)?.nom || 'SANS SECTEUR';
  };

  const filteredPlats = plats.filter(p => 
    (activeFilterCat === null || p.categorie === activeFilterCat) &&
    (p.nom.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredPlats.length / itemsPerPage);
  const paginatedPlats = filteredPlats.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-sans selection:bg-primary/20 overflow-hidden">
      
      {/* Archive Header */}
      <div className="flex-none flex justify-between items-end px-8 py-8 border-b border-outline bg-surface-container-lowest">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-on-surface uppercase italic leading-none">Archives Gastronomiques</h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.4em] mt-3 opacity-50">Gestion du Catalogue et des Fiches Techniques</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60 group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="NOM DU PLAT..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-64 h-12 bg-surface-container-low border border-outline pl-12 pr-4 rounded-lg text-[10px] font-bold text-on-surface focus:border-primary outline-none transition-all uppercase placeholder:text-on-surface-variant/30"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <select 
              value={activeFilterCat || ''} 
              onChange={(e) => { setActiveFilterCat(e.target.value ? parseInt(e.target.value) : null); setCurrentPage(1); }}
              className="h-12 bg-surface-container-low border border-outline rounded-lg px-4 text-[10px] font-black uppercase tracking-widest min-w-[160px] text-on-surface"
            >
              <option value="">TOUS LES SECTEURS</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nom.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <button onClick={() => handleOpenEditor()} data-testid="plat-create-button" className="btn-primary">
            <Plus className="w-4 h-4" strokeWidth={3} /> Nouvelle Fiche
          </button>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="flex-1 overflow-hidden flex flex-col p-8 min-h-0">
        <div className="flex-1 bg-surface-container-lowest border border-outline rounded-xl overflow-hidden flex flex-col">
          
          {/* Table Header */}
          <div className="flex-none grid grid-cols-12 gap-4 px-8 py-5 border-b border-outline bg-surface-container-low text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">
            <div className="col-span-1 flex items-center gap-2"><Hash className="w-3 h-3" /> ID</div>
            <div className="col-span-1 flex items-center justify-center"><ImageIcon className="w-3 h-3" /></div>
            <div className="col-span-4">Nomenclature & Description</div>
            <div className="col-span-2">Secteur</div>
            <div className="col-span-1 text-center">Valeur</div>
            <div className="col-span-1 text-center">Stock</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {paginatedPlats.length > 0 ? paginatedPlats.map((plat) => (
                <div 
                  key={plat.id}
                  data-testid={`plat-card-${plat.id}`}
                  className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-outline-variant hover:bg-white/[0.02] transition-colors items-center group"
                >
                  <div className="col-span-1 font-mono text-xs font-bold text-on-surface-variant/40">#{plat.id}</div>
                  <div className="col-span-1 flex justify-center">
                    <div className="w-10 h-10 rounded border border-outline bg-background overflow-hidden shrink-0">
                        {plat.image ? (
                            <img src={plat.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-on-surface-variant/20">{plat.nom.charAt(0)}</div>
                        )}
                    </div>
                  </div>
                  <div className="col-span-4 min-w-0 pr-4">
                    <h3 className="text-sm font-black text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors truncate">{plat.nom}</h3>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-50 truncate">{plat.description || 'AUCUN RÉCIT CULINAIRE'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-surface-container-low border border-outline px-3 py-1 rounded text-on-surface-variant">
                        {getCategoryName(plat.categorie)}
                    </span>
                  </div>
                  <div className="col-span-1 text-center font-mono text-xs font-black text-primary">
                    {parseFloat(plat.prix).toFixed(0)} DH
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button 
                        onClick={() => toggleAvailability(plat)}
                        className={`w-10 h-5 rounded-full relative transition-all border ${plat.est_disponible ? 'bg-primary' : 'bg-surface-container-high'}`}
                    >
                        <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${plat.est_disponible ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button onClick={() => handleOpenEditor(plat)} data-testid={`plat-edit-${plat.id}`} className="w-9 h-9 border border-outline rounded flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:border-on-surface transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(plat.id)} data-testid={`plat-delete-${plat.id}`} className="w-9 h-9 border border-outline rounded flex items-center justify-center text-on-surface-variant hover:text-error hover:border-error transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
            )) : (
                <div className="h-64 flex flex-col items-center justify-center opacity-10">
                    <Activity className="w-16 h-16 mb-4" strokeWidth={1} />
                    <p className="text-xs font-black uppercase tracking-[0.4em]">Archive Vide</p>
                </div>
            )}
          </div>

          {/* Table Footer */}
          <div className="flex-none px-8 py-5 border-t border-outline bg-surface-container-low flex justify-between items-center">
            <span className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest">
                Total : {filteredPlats.length} Fiches identifiées
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

      {/* Gastronomic Editor Side-panel */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/80">
            <motion.aside 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="w-full max-w-2xl h-full bg-surface-container-lowest border-l border-outline flex flex-col"
            >
                <div className="flex-none h-24 flex items-center justify-between px-10 border-b border-outline bg-surface-container-lowest">
                    <div>
                        <h2 className="text-2xl font-black text-on-surface italic tracking-tighter uppercase">{editingPlat ? 'Édition Fiche Technique' : 'Nouvelle Création'}</h2>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.3em] mt-2">Configuration du Produit et de la Recette</p>
                    </div>
                    <button onClick={() => setIsEditorOpen(false)} className="p-3 bg-surface-container-high rounded-lg hover:text-primary transition-all"><X className="w-7 h-7" /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
                    <div className="grid grid-cols-3 gap-8">
                        <div className="col-span-3 space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Intitulé du Plat</label>
                            <input type="text" required data-testid="plat-name-input" value={nom} onChange={(e) => setNom(e.target.value)} className="w-full h-16 px-6 bg-background border border-outline rounded-xl font-black text-2xl text-on-surface uppercase focus:border-primary" placeholder="DÉNOMINATION CULINAIRE" />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Secteur d'Affichage</label>
                            <select value={selectedCat} onChange={(e) => setSelectedCat(parseInt(e.target.value))} className="w-full h-14 bg-background border border-outline rounded-lg text-on-surface font-bold text-xs uppercase px-4 focus:border-primary">
                                {categories.map(c => <option key={c.id} value={c.id}>{c.nom.toUpperCase()}</option>)}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Tarification (DH)</label>
                            <input type="number" required data-testid="plat-price-input" value={prix} onChange={(e) => setPrix(e.target.value)} className="w-full h-14 px-6 bg-background border border-outline rounded-lg font-mono text-lg font-black text-primary focus:border-primary" placeholder="00" />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Temps de Préparation (Min)</label>
                            <input type="number" required data-testid="plat-time-input" value={temps} onChange={(e) => setTemps(parseInt(e.target.value) || 0)} className="w-full h-14 px-6 bg-background border border-outline rounded-lg font-mono text-lg font-black text-primary focus:border-primary" placeholder="15" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Ressource Visuelle</label>
                        <div className="relative aspect-video rounded-xl border-2 border-dashed border-outline bg-background flex flex-col items-center justify-center overflow-hidden hover:border-primary transition-all group">
                            {preview ? (
                                <>
                                    <img src={preview} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-20 transition-all duration-700" alt="" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 z-10 transition-all">
                                        <CloudUpload className="w-10 h-10 text-primary mb-3" />
                                        <span className="text-[10px] font-black text-on-surface uppercase tracking-widest">Remplacer le fichier</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all">
                                    <ImageIcon className="w-12 h-12 mb-3" strokeWidth={1} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Charger une image haute définition</span>
                                </div>
                            )}
                            <input type="file" data-testid="plat-image-input" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Récit Culinaire / Ingrédients clés</label>
                        <textarea rows={4} data-testid="plat-description-input" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-6 bg-background border border-outline rounded-xl font-bold text-sm text-on-surface uppercase focus:border-primary resize-none" placeholder="DESCRIPTION DÉTAILLÉE POUR LE CLIENT..." />
                    </div>

                    {/* Technical Recipe Section */}
                    <div className="space-y-6 pt-10 border-t border-outline">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-on-surface uppercase">Recette Technique & Déductions</h3>
                                <p className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest mt-1">Liaison automatique avec les stocks</p>
                            </div>
                            <button type="button" onClick={addIngredientRow} className="px-4 py-2 bg-primary/10 border border-primary/30 rounded text-[9px] font-black text-primary uppercase hover:bg-primary hover:text-on-primary transition-all">+ Lier Ingrédient</button>
                        </div>
                        
                        <div className="space-y-3">
                            {selectedIngredients.map((item, index) => (
                                <div key={index} className="flex gap-4 items-center bg-surface-container-lowest p-4 border border-outline rounded-xl group">
                                    <select 
                                        value={item.ingredient} onChange={(e) => updateIngredientRow(index, 'ingredient', parseInt(e.target.value))}
                                        className="flex-1 bg-transparent border-none font-sans text-xs font-bold text-on-surface focus:ring-0 uppercase"
                                    >
                                        {allIngredients.map(ing => <option key={ing.id} value={ing.id}>{ing.nom}</option>)}
                                    </select>
                                    <input 
                                        type="number" step="0.01" value={item.quantite} onChange={(e) => updateIngredientRow(index, 'quantite', e.target.value)}
                                        className="w-24 bg-background border border-outline rounded-lg px-3 py-2 font-mono text-xs font-black text-primary text-center"
                                    />
                                    <button type="button" onClick={() => removeIngredientRow(index)} className="p-2 text-on-surface-variant/40 hover:text-error transition-all"><X className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </form>

                <div className="flex-none h-24 bg-surface-container-lowest border-t border-outline p-6 flex gap-6">
                    <button type="button" onClick={() => setIsEditorOpen(false)} className="flex-1 border border-outline rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Annuler</button>
                    <button onClick={handleSubmit} disabled={isSaving} data-testid="plat-save-button" className="flex-[2] bg-primary text-on-primary rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Sauvegarder la Fiche</>}
                    </button>
                </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
