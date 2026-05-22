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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const CategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Categorie | null>(null);
  const [search, setSearch] = useState('');
  
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
  };

  const startNewCategory = () => {
    setEditingCategory(null);
    setNom('');
    setDescription('');
    setOrdre(categories.length > 0 ? Math.max(...categories.map(c => c.ordre_affichage)) + 1 : 1);
    setPreview(null);
    setImage(null);
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
        toast.success('Category updated successfully');
      } else {
        await menuApi.createCategory(formData);
        toast.success('Category created successfully');
      }
      fetchCategories();
      // Keep editor open but refresh data
    } catch (err) {
      toast.error('Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await menuApi.deleteCategory(id);
        toast.success('Category deleted');
        fetchCategories();
        if (editingCategory?.id === id) {
           setEditingCategory(null);
        }
      } catch (err) {
        toast.error('Deletion failed');
      }
    }
  };

  const filteredCategories = categories.filter(c => 
    c.nom.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/></div>;

  return (
    <div className="h-full flex flex-col -m-4 bg-surface-main overflow-hidden font-body selection:bg-primary/20">
      
      {/* Top Controls Area */}
      <div className="flex-none flex items-end justify-between px-staff-margin py-unit-lg border-b border-outline-variant bg-surface-main">
        <div>
          <h1 className="font-serif text-3xl font-black text-on-surface tracking-tighter uppercase">Category Management</h1>
          <h2 className="sr-only">Catégories</h2>
          <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-1">Hierarchical menu structure configuration</p>
        </div>
        <div className="flex gap-unit-md items-center">
           <div className="relative group mr-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="text"
              placeholder="FILTER INDEX..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 h-10 bg-surface-container-low border border-outline-variant pl-10 pr-4 rounded font-sans text-[10px] font-bold text-on-surface focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/30"
            />
          </div>
          <button 
            onClick={() => setEditingCategory(null)} // Discard
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded font-sans text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Discard
          </button>
          <button 
            onClick={startNewCategory}
            data-testid="category-create-button"
            className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded font-sans text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" /> New Category
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-0">
        
        {/* Left Panel: Category List (8 cols) */}
        <div className="col-span-8 h-full border-r border-outline-variant bg-surface-container-lowest flex flex-col">
          {/* List Header */}
          <div className="flex-none px-6 py-3 border-b border-outline-variant bg-surface-container flex items-center text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
            <div className="w-8"></div>
            <div className="w-12"></div>
            <div className="flex-1">Category Name</div>
            <div className="w-24 text-center">Rank</div>
            <div className="w-32 text-center">Status</div>
            <div className="w-10"></div>
          </div>

          {/* Scrollable List Body */}
          <div className="flex-1 overflow-y-auto p-unit-sm space-y-1 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredCategories.map((cat) => (
                <motion.div 
                  key={cat.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => selectCategory(cat)}
                  data-testid={`category-card-${cat.id}`}
                  className={`
                    group flex items-center gap-unit-md p-unit-sm rounded border transition-all cursor-pointer relative overflow-hidden
                    ${editingCategory?.id === cat.id ? 'bg-surface-container-highest border-primary/50 ring-1 ring-primary/20' : 'bg-transparent border-transparent hover:bg-surface-container-low'}
                  `}
                >
                  {editingCategory?.id === cat.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                  
                  {/* Drag Handle Spacer */}
                  <div className="text-on-surface-variant/20 group-hover:text-primary transition-colors">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded border border-outline-variant bg-surface-main overflow-hidden shrink-0">
                    {cat.image ? (
                      <img src={cat.image} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" alt={cat.nom} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant/20 font-serif italic text-xl">
                        {cat.nom.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-sans text-[13px] font-black uppercase tracking-tight ${editingCategory?.id === cat.id ? 'text-primary' : 'text-on-surface'}`}>
                      {cat.nom}
                    </h3>
                    <p className="font-sans text-[10px] text-on-surface-variant truncate uppercase tracking-widest mt-0.5 opacity-60">
                      {cat.description || 'No context logged'}
                    </p>
                  </div>

                  {/* Rank */}
                  <div className="w-24 text-center">
                    <span className="font-mono text-[11px] font-bold text-on-surface-variant bg-background px-2 py-0.5 rounded border border-outline-variant/30">
                      #{cat.ordre_affichage.toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="w-32 flex justify-center">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${cat.est_active ? 'bg-success/5 border-success/20 text-success' : 'bg-on-surface-variant/5 border-on-surface-variant/20 text-on-surface-variant'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${cat.est_active ? 'bg-success animate-pulse' : 'bg-on-surface-variant'}`} />
                      <span className="font-sans text-[9px] font-black uppercase tracking-wider">{cat.est_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-10 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                    <button data-testid={`category-edit-${cat.id}`} className="p-1 hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button data-testid={`category-delete-${cat.id}`} onClick={(e) => { e.stopPropagation(); handleDelete(cat.id); }} className="p-1 hover:text-error transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel: Category Editor (4 cols) */}
        <aside className="col-span-4 h-full bg-surface-container-low p-staff-margin border-l border-outline-variant overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start mb-unit-lg">
            <div>
              <h2 className="font-serif text-xl font-black text-on-surface tracking-tight uppercase">
                {editingCategory ? 'Edit Sector' : 'New Sector'}
              </h2>
              <p className="font-sans text-[10px] font-bold text-on-surface-variant uppercase mt-1 tracking-widest">Metadata Configuration</p>
            </div>
            {editingCategory && (
               <button onClick={() => setEditingCategory(null)} className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant">
                  <X className="w-5 h-5" />
               </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-unit-lg">
            {/* Image Upload Area */}
            <div className="space-y-unit-xs">
              <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Visual Identity</label>
              <div className="relative group aspect-video rounded border-2 border-dashed border-outline-variant bg-surface-container-lowest flex flex-col items-center justify-center overflow-hidden transition-all hover:border-primary">
                {preview ? (
                   <>
                    <img src={preview} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-20 transition-all duration-700" alt="Preview" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/40">
                       <CloudUpload className="w-8 h-8 text-primary mb-2" />
                       <span className="font-sans text-[10px] font-black text-white uppercase tracking-widest">Replace File</span>
                    </div>
                   </>
                ) : (
                  <div className="flex flex-col items-center text-on-surface-variant/20 group-hover:text-primary transition-colors">
                    <CloudUpload className="w-10 h-10 mb-2 stroke-[1]" />
                    <span className="font-sans text-[10px] font-bold uppercase tracking-widest">Upload Asset</span>
                  </div>
                )}
                <input type="file" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-unit-md">
              <div className="space-y-unit-xs">
                <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Sector Name</label>
                <input 
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  data-testid="category-name-input"
                  className="w-full h-12 px-4 bg-surface-main border border-outline-variant rounded font-sans font-bold text-on-surface focus:border-primary outline-none transition-all uppercase tracking-tight"
                />
              </div>

              <div className="space-y-unit-xs">
                <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Operations Memo</label>
                <textarea 
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="category-description-input"
                  className="w-full p-4 bg-surface-main border border-outline-variant rounded font-sans text-[13px] font-bold text-on-surface focus:border-primary outline-none transition-all uppercase placeholder:text-on-surface-variant/20 resize-none"
                  placeholder="EX: CORE DINNER MENU STARTERS..."
                />
              </div>

              <div className="space-y-unit-xs">
                <label className="block font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Hierarchy Rank</label>
                <input 
                  type="number"
                  value={ordre}
                  onChange={(e) => setOrdre(parseInt(e.target.value) || 0)}
                  data-testid="category-order-input"
                  className="w-full h-12 px-4 bg-surface-main border border-outline-variant rounded font-mono font-bold text-on-surface focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="py-unit-md border-y border-outline-variant/30 flex items-center justify-between">
              <div>
                <label className="block font-sans text-[12px] font-black text-on-surface uppercase">Live Visibility</label>
                <p className="font-sans text-[10px] text-on-surface-variant uppercase mt-0.5 tracking-wider opacity-60">Show on POS & Menu</p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingCategory(prev => prev ? { ...prev, est_active: !prev.est_active } : null)}
                className={`w-12 h-6 rounded-full relative transition-all border ${editingCategory?.est_active ?? true ? 'bg-primary border-primary' : 'bg-surface-container-highest border-outline-variant'}`}
              >
                <div className={`absolute top-1 w-3.5 h-3.5 rounded-full bg-white transition-all ${editingCategory?.est_active ?? true ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {/* Actions */}
            <div className="pt-4 flex gap-unit-md">
              <button 
                type="submit"
                disabled={isSaving}
                data-testid="category-save-button"
                className="flex-1 h-14 bg-primary text-on-primary rounded font-sans text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-primary"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Commit Data</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
};

