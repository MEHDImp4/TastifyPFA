import React, { useState, useEffect } from 'react';
import { menuApi } from '../../api/menu';
import type { Categorie } from '../../types/menu';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  CloudUpload,
  Search,
  X,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Hash,
  Activity,
  Image as ImageIcon,
  Save
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
  const itemsPerPage = 10;

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
        toast.success('UNITÉ MISE À JOUR');
      } else {
        await menuApi.createCategory(formData);
        toast.success('NOUVEAU SECTEUR CRÉÉ');
      }
      fetchCategories();
      setIsEditorOpen(false);
      setEditingCategory(null);
    } catch (err) {
      toast.error('ÉCHEC SAUVEGARDE');
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
        toast.success('SECTEUR SUPPRIMÉ');
        fetchCategories();
        if (editingCategory?.id === categoryToDelete) {
           setEditingCategory(null);
           setIsEditorOpen(false);
        }
    } catch (err) {
        toast.error('ÉCHEC SUPPRESSION');
    }
    setCategoryToDelete(null);
  };

  const filteredCategories = categories.filter(c => 
    c.nom.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-sans selection:bg-primary/20 overflow-hidden">
      
      {/* Registry Header */}
      <div className="flex-none flex justify-between items-end px-8 py-8 border-b border-outline bg-surface-container-lowest">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-on-surface uppercase italic leading-none">Registre des Catégories</h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.4em] mt-3 opacity-50">Configuration de l'Architecture du Menu</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="FILTRER PAR NOM..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-64 h-12 bg-surface-container-low border border-outline pl-12 pr-4 rounded-lg text-[10px] font-bold text-on-surface focus:border-primary outline-none transition-all uppercase placeholder:text-on-surface-variant/30"
            />
          </div>
          <button 
            onClick={startNewCategory}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" strokeWidth={3} /> Nouvelle Catégorie
          </button>
        </div>
      </div>

      {/* Registry Table Area */}
      <div className="flex-1 overflow-hidden flex flex-col p-8 min-h-0">
        <div className="flex-1 bg-surface-container-lowest border border-outline rounded-xl overflow-hidden flex flex-col">
          
          {/* Table Header */}
          <div className="flex-none grid grid-cols-12 gap-4 px-8 py-5 border-b border-outline bg-surface-container-low text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">
            <div className="col-span-1 flex items-center gap-2"><Hash className="w-3 h-3" /> ID</div>
            <div className="col-span-1 flex items-center justify-center"><ImageIcon className="w-3 h-3" /></div>
            <div className="col-span-4">Libellé du Secteur</div>
            <div className="col-span-2 text-center">Ordre</div>
            <div className="col-span-2 text-center">Statut</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {paginatedCategories.length > 0 ? paginatedCategories.map((cat) => (
                <div 
                  key={cat.id}
                  className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-outline-variant hover:bg-white/[0.02] transition-colors items-center group"
                >
                  <div className="col-span-1 font-mono text-xs font-bold text-on-surface-variant/40">#{cat.id}</div>
                  <div className="col-span-1 flex justify-center">
                    <div className="w-10 h-10 rounded border border-outline bg-background overflow-hidden shrink-0">
                        {cat.image ? (
                            <img src={cat.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-on-surface-variant/20">{cat.nom.charAt(0)}</div>
                        )}
                    </div>
                  </div>
                  <div className="col-span-4">
                    <h3 className="text-sm font-black text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors">{cat.nom}</h3>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-50 truncate">{cat.description || 'SANS DESCRIPTION'}</p>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="font-mono text-xs font-black text-primary bg-primary/5 px-3 py-1 rounded border border-primary/20">{cat.ordre_affichage.toString().padStart(2, '0')}</span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${cat.est_active ? 'bg-success/5 border-success/30 text-success' : 'bg-surface-container-low border-outline text-on-surface-variant/40'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${cat.est_active ? 'bg-success' : 'bg-outline-variant'}`} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{cat.est_active ? 'ACTIF' : 'INACTIF'}</span>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button onClick={() => selectCategory(cat)} className="w-9 h-9 border border-outline rounded flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:border-on-surface transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => confirmDelete(cat.id)} className="w-9 h-9 border border-outline rounded flex items-center justify-center text-on-surface-variant hover:text-error hover:border-error transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
            )) : (
                <div className="h-64 flex flex-col items-center justify-center opacity-10">
                    <Activity className="w-16 h-16 mb-4" strokeWidth={1} />
                    <p className="text-xs font-black uppercase tracking-[0.4em]">Registre Vide</p>
                </div>
            )}
          </div>

          {/* Table Footer / Pagination */}
          <div className="flex-none px-8 py-5 border-t border-outline bg-surface-container-low flex justify-between items-center">
            <span className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest">
                Total : {filteredCategories.length} Secteurs identifiés
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

      {/* Editor Side-panel */}
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
                        <h2 className="text-2xl font-black text-on-surface italic tracking-tighter uppercase">{editingCategory ? 'Configuration Secteur' : 'Nouveau Secteur'}</h2>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.3em] mt-2">Édition des métadonnées structurelles</p>
                    </div>
                    <button onClick={() => setIsEditorOpen(false)} className="p-3 bg-surface-container-high rounded-lg hover:text-primary transition-all"><X className="w-7 h-7" /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
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
                                    <CloudUpload className="w-12 h-12 mb-3" strokeWidth={1} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Charger une icône / Image</span>
                                </div>
                            )}
                            <input type="file" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Dénomination</label>
                        <input type="text" required value={nom} onChange={(e) => setNom(e.target.value)} className="w-full h-16 px-6 bg-background border border-outline rounded-xl font-black text-2xl text-on-surface uppercase focus:border-primary" placeholder="NOM DU SECTEUR" />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Description Technique</label>
                        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-6 bg-background border border-outline rounded-xl font-bold text-sm text-on-surface uppercase focus:border-primary resize-none" placeholder="DÉTAILS OPÉRATIONNELS..." />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 ml-1">Rang d'Affichage</label>
                        <input type="number" value={ordre} onChange={(e) => setOrdre(parseInt(e.target.value) || 0)} className="w-full h-16 px-6 bg-background border border-outline rounded-xl font-mono text-xl font-black text-primary focus:border-primary" />
                    </div>

                    <div className="py-10 border-y border-outline flex items-center justify-between">
                        <div>
                            <span className="text-sm font-black text-on-surface uppercase tracking-tight">Statut de Visibilité</span>
                            <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mt-1">Actif sur le TPV et Menu Digital</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setEditingCategory(prev => prev ? { ...prev, est_active: !prev.est_active } : null)}
                            className={`w-14 h-7 rounded-full relative transition-all ${editingCategory?.est_active ?? true ? 'bg-primary' : 'bg-surface-container-high'}`}
                        >
                            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${editingCategory?.est_active ?? true ? 'right-1' : 'left-1'}`} />
                        </button>
                    </div>
                </form>

                <div className="flex-none h-24 bg-surface-container-lowest border-t border-outline p-6 flex gap-6">
                    <button type="button" onClick={() => setIsEditorOpen(false)} className="flex-1 border border-outline rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Annuler</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="flex-[2] bg-primary text-on-primary rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Sauvegarder</>}
                    </button>
                </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={executeDelete}
          title="DÉSTRUCTION UNITÉ"
          message="Confirmez-vous la suppression définitive de cette catégorie ? Cette action est irréversible."
          confirmLabel="DÉTRUIRE"
          variant="danger"
      />
    </div>
  );
};
