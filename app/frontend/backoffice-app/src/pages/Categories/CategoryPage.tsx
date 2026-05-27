import React, { useState, useEffect } from 'react';
import { menuApi } from '../../api/menu';
import type { Categorie } from '../../types/menu';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  GripVertical,
  Save,
  RotateCcw,
  CloudUpload,
  Search,
  X,
  Edit2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export const CategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Categorie | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  // Form state
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [ordre, setOrdre] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await menuApi.getCategories();
      setCategories(res.data.sort((a, b) => a.ordre_affichage - b.ordre_affichage));
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const selectCategory = (cat: Categorie) => {
    setEditingCategory(cat);
    setNom(cat.nom);
    setDescription(cat.description || '');
    setOrdre(cat.ordre_affichage);
    setPreview(cat.image);
    setImage(null);
    setIsEditorOpen(true);
  };

  const startNewCategory = () => {
    setEditingCategory(null);
    setNom('');
    setDescription('');
    setOrdre(categories.length > 0 ? Math.max(...categories.map(c => c.ordre_affichage)) + 1 : 1);
    setPreview(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData();
    formData.append('nom', nom);
    formData.append('description', description);
    formData.append('ordre_affichage', ordre.toString());
    formData.append('est_active', String(editingCategory?.est_active ?? true));
    if (image) formData.append('image', image);

    try {
      if (editingCategory) {
        await menuApi.updateCategory(editingCategory.id, formData);
        toast.success('Catégorie mise à jour');
      } else {
        await menuApi.createCategory(formData);
        toast.success('Catégorie créée');
      }
      fetchCategories();
      setIsEditorOpen(false);
      setEditingCategory(null);
    } catch (err) {
      toast.error('Erreur d\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (id: number) => {
    setCategoryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!categoryToDelete) return;
    try {
        await menuApi.deleteCategory(categoryToDelete);
        toast.success('Catégorie supprimée');
        fetchCategories();
        if (editingCategory?.id === categoryToDelete) {
           setEditingCategory(null);
           setIsEditorOpen(false);
        }
    } catch (err) {
        toast.error('Échec de suppression');
    }
    setCategoryToDelete(null);
  };

  const filteredCategories = categories.filter(c => 
    c.est_active && c.nom.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/></div>;

  return (
    <div className="h-full flex flex-col -m-4 bg-surface-main overflow-hidden font-body selection:bg-primary/20">
      
      {/* Top Controls Area */}
      <div className="flex-none flex items-end justify-between px-staff-margin py-unit-lg border-b border-outline-variant bg-surface-main">
        <div>
          <h1 className="font-serif text-3xl font-black text-on-surface tracking-tighter uppercase">Gestion des Catégories</h1>
          <h2 className="sr-only">Catégories</h2>
          <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-1">Configuration de la structure hiérarchique du menu</p>
        </div>
        <div className="flex gap-unit-md items-center">
           <div className="relative group mr-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="text"
              placeholder="RECHERCHE..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-48 h-10 bg-surface-container-low border border-outline-variant pl-10 pr-4 rounded font-sans text-[10px] font-bold text-on-surface focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/30"
            />
          </div>
          <button 
            onClick={() => { setSearch(''); setEditingCategory(null); setIsEditorOpen(false); setCurrentPage(1); }}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded font-sans text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Annuler
          </button>
          <button 
            onClick={startNewCategory}
            data-testid="category-create-button"
            className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded font-sans text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" /> Nouvelle Catégorie
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* Category List */}
        <div className="h-full bg-surface-container-lowest flex flex-col">
          {/* List Header */}
          <div className="flex-none px-6 py-3 border-b border-outline-variant bg-surface-container flex items-center text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
            <div className="w-8"></div>
            <div className="w-12"></div>
            <div className="flex-1">Nom de la Catégorie</div>
            <div className="w-24 text-center">Rang</div>
            <div className="w-32 text-center">Statut</div>
            <div className="w-10"></div>
          </div>

          {/* Scrollable List Body */}
          <div className="flex-1 overflow-y-auto p-unit-sm space-y-1 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {paginatedCategories.map((cat) => (
                <motion.div 
                  key={cat.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  data-testid={`category-card-${cat.id}`}
                  className={`
                    group flex items-center gap-unit-md p-unit-sm rounded border transition-all cursor-default relative overflow-hidden
                    ${editingCategory?.id === cat.id ? 'bg-surface-container-highest border-primary/50 ring-1 ring-primary/20' : 'bg-transparent border-transparent hover:bg-surface-container-low'}
                  `}
                >
                  {editingCategory?.id === cat.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                  
                  <div className="text-on-surface-variant/20 group-hover:text-primary transition-colors">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  <div className="w-12 h-12 rounded border border-outline-variant bg-surface-main overflow-hidden shrink-0 shadow-inner">
                    {cat.image ? (
                      <img src={cat.image} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" alt={cat.nom} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant/20 font-serif italic text-xl">
                        {cat.nom.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`font-sans text-[13px] font-black uppercase tracking-tight ${editingCategory?.id === cat.id ? 'text-primary' : 'text-on-surface'}`}>
                      {cat.nom}
                    </h3>
                    <p className="font-sans text-[10px] text-on-surface-variant truncate uppercase tracking-widest mt-0.5 opacity-60">
                      {cat.description || 'Aucun contexte enregistré'}
                    </p>
                  </div>

                  <div className="w-24 text-center">
                    <span className="font-mono text-[11px] font-bold text-on-surface-variant bg-background px-2 py-0.5 rounded border border-outline-variant/30">
                      #{cat.ordre_affichage.toString().padStart(2, '0')}
                    </span>
                  </div>

                  <div className="w-32 flex justify-center">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${cat.est_active ? 'bg-success/5 border-success/20 text-success' : 'bg-on-surface-variant/5 border-on-surface-variant/20 text-on-surface-variant'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${cat.est_active ? 'bg-success animate-pulse' : 'bg-on-surface-variant'}`} />
                      <span className="font-sans text-[9px] font-black uppercase tracking-wider">{cat.est_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>

                  <div className="w-10 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                    <button 
                      type="button" 
                      onClick={() => selectCategory(cat)}
                      className="p-1 hover:text-primary transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); confirmDelete(cat.id); }}
                      className="p-1 hover:text-error transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
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

        {/* Slide-over Category Editor */}
        <AnimatePresence>
          {isEditorOpen && (
            <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
              <motion.aside 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-lg h-full bg-surface-container-low border-l border-outline-variant shadow-2xl flex flex-col"
              >
                <div className="flex-none flex items-center justify-between p-6 border-b border-outline-variant bg-surface-main">
                  <div>
                    <h2 className="font-serif text-2xl font-black text-on-surface uppercase tracking-tight">
                      {editingCategory ? 'Modifier Secteur' : 'Nouveau Secteur'}
                    </h2>
                    <p className="font-sans text-[10px] font-bold text-on-surface-variant uppercase mt-1 tracking-widest">Configuration des Métadonnées</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setEditingCategory(null); setIsEditorOpen(false); }}
                    className="p-2 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-unit-lg">
                  <div className="space-y-unit-xs">
                    <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Identité Visuelle</label>
                    <div className="relative group aspect-video rounded border-2 border-dashed border-outline-variant bg-surface-container-lowest flex flex-col items-center justify-center overflow-hidden transition-all hover:border-primary">
                      {preview ? (
                         <>
                         <img src={preview} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-20 transition-all duration-700" alt="Aperçu" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/40">
                             <CloudUpload className="w-8 h-8 text-primary mb-2" />
                             <span className="font-sans text-[10px] font-black text-white uppercase tracking-widest">Remplacer Fichier</span>
                          </div>
                         </>
                      ) : (
                        <div className="flex flex-col items-center text-on-surface-variant/20 group-hover:text-primary transition-colors">
                          <CloudUpload className="w-10 h-10 mb-2 stroke-[1]" />
                          <span className="font-sans text-[10px] font-bold uppercase tracking-widest">Charger Ressource</span>
                        </div>
                      )}
                      <input type="file" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                    </div>
                  </div>

                  <div className="space-y-unit-md">
                    <div className="space-y-unit-xs">
                      <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Nom du Secteur</label>
                      <input 
                        type="text" required value={nom} onChange={(e) => setNom(e.target.value)}
                        className="w-full h-12 px-4 bg-surface-main border border-outline-variant rounded font-sans font-bold text-on-surface focus:border-primary outline-none transition-all uppercase tracking-tight"
                      />
                    </div>

                    <div className="space-y-unit-xs">
                      <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Mémo Opérationnel</label>
                      <textarea 
                        rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-4 bg-surface-main border border-outline-variant rounded font-sans text-[13px] font-bold text-on-surface focus:border-primary outline-none transition-all uppercase placeholder:text-on-surface-variant/20 resize-none"
                        placeholder="EX: ENTRÉES DU MENU PRINCIPAL..."
                      />
                    </div>

                    <div className="space-y-unit-xs">
                      <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Rang Hiérarchique</label>
                      <input 
                        type="number" value={ordre} onChange={(e) => setOrdre(parseInt(e.target.value) || 0)}
                        className="w-full h-12 px-4 bg-surface-main border border-outline-variant rounded font-mono font-bold text-on-surface focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="py-unit-md border-y border-outline-variant/30 flex items-center justify-between">
                    <div>
                      <label className="block font-sans text-[12px] font-black text-on-surface uppercase">Visibilité en Direct</label>
                      <p className="font-sans text-[10px] text-on-surface-variant uppercase mt-0.5 tracking-wider opacity-60">Afficher sur le TPV & Menu</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setEditingCategory(prev => prev ? { ...prev, est_active: !prev.est_active } : null)}
                      className={`w-12 h-6 rounded-full relative transition-all border ${editingCategory?.est_active ?? true ? 'bg-primary border-primary' : 'bg-surface-container-highest border-outline-variant'}`}
                    >
                      <div className={`absolute top-1 w-3.5 h-3.5 rounded-full bg-white transition-all ${editingCategory?.est_active ?? true ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </form>

                <div className="flex-none p-6 border-t border-outline-variant bg-surface-main flex gap-4">
                  <button type="button" onClick={() => { setEditingCategory(null); setIsEditorOpen(false); }} className="flex-1 h-14 border border-outline-variant rounded font-sans text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant hover:bg-surface-container-high transition-all">Annuler</button>
                  <button 
                    onClick={handleSubmit} disabled={isSaving}
                    className="flex-[2] h-14 bg-primary text-on-primary rounded font-sans text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-primary"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /><span>Enregistrer</span></>}
                  </button>
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Custom Confirmation Modal */}
      <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={executeDelete}
          title="Supprimer Catégorie"
          message="Êtes-vous sûr de vouloir supprimer définitivement cette catégorie ? Tous les plats associés risquent de perdre leur secteur."
          confirmLabel="SUPPRIMER"
          variant="danger"
      />
    </div>
  );
};
