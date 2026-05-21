import React, { useState, useEffect } from 'react';
import { menuApi } from '../../api/menu';
import type { Categorie } from '../../types/menu';
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2, ListOrdered, FileText, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

import { CardSkeleton } from '../../components/ui/Skeleton';

export const CategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categorie | null>(null);
  
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
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (cat?: Categorie) => {
    if (cat) {
      setEditingCategory(cat);
      setNom(cat.nom);
      setDescription(cat.description);
      setOrdre(cat.ordre_affichage);
      setPreview(cat.image);
    } else {
      setEditingCategory(null);
      setNom('');
      setDescription('');
      setOrdre(0);
      setPreview(null);
    }
    setImage(null);
    setIsModalOpen(true);
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
      } else {
        await menuApi.createCategory(formData);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Failed to save category', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await menuApi.deleteCategory(id);
        fetchCategories();
      } catch (err) {
        console.error('Failed to delete category', err);
      }
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-display-lg text-[32px] text-on-surface leading-none">Menu Architecture</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-secondary"></div>
            <span className="text-ui-data-dense uppercase tracking-widest text-on-surface-variant font-bold">Structural Sector Configuration</span>
          </div>
        </div>
        <button 
          data-testid="category-create-button"
          onClick={() => handleOpenModal()}
          className="flex items-center gap-3 px-6 py-3 bg-primary text-on-primary border-2 border-on-surface text-ui-button font-ui-button shadow-[4px_4px_0px_#301400] transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#301400] active:translate-y-[2px] active:shadow-none"
        >
          <Plus className="w-5 h-5"  strokeWidth={2.5}/>
          <span>DEFINE NEW SECTOR</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.filter(c => c.est_active).map((cat) => (
            <div 
              key={cat.id}
              data-testid={`category-card-${cat.id}`}
              className="group bg-surface-container border-2 border-on-surface p-4 transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#301400]"
            >
              <div className="aspect-[16/9] relative border-2 border-on-surface bg-background mb-6 overflow-hidden">
                {cat.image ? (
                  <img src={cat.image} alt={cat.nom} className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0 transition-all duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-4xl text-on-surface/5 font-serif italic">
                    {cat.nom.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    data-testid={`category-edit-${cat.id}`}
                    onClick={() => handleOpenModal(cat)}
                    className="p-3 bg-background border-2 border-on-surface text-on-surface hover:bg-primary hover:text-on-primary transition-all active:scale-90"
                  >
                    <Edit2 className="w-4 h-4"  strokeWidth={2.5}/>
                  </button>
                  <button 
                    data-testid={`category-delete-${cat.id}`}
                    onClick={() => handleDelete(cat.id)}
                    className="p-3 bg-background border-2 border-on-surface text-on-surface hover:bg-error hover:text-on-error transition-all active:scale-90"
                  >
                    <Trash2 className="w-4 h-4"  strokeWidth={2.5}/>
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 bg-on-surface text-background px-3 py-0.5 text-ui-label-bold text-[9px]">
                    ARCH-RANK: #{cat.ordre_affichage}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-ui-label-bold text-base text-on-surface font-black uppercase tracking-tight">{cat.nom}</h3>
                <p className="text-ui-data-dense font-black text-on-surface-variant opacity-60 leading-relaxed line-clamp-2 h-10">
                  {cat.description?.toUpperCase() || 'NO SECTOR CONTEXT LOGGED.'}
                </p>
                <div className="pt-4 border-t-2 border-on-surface/5 flex justify-between items-center">
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Live Status: Active</span>
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingCategory ? 'EDIT SECTOR METADATA' : 'ARCHITECT NEW SECTOR'}
      >
        <form onSubmit={handleSubmit} className="space-y-6 p-2">
          <div className="space-y-2">
            <label className="text-ui-label-bold text-[10px] text-on-surface-variant flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary"  strokeWidth={2.5}/>
                <span>IDENTIFICATION</span>
            </label>
            <input 
              type="text" 
              data-testid="category-name-input"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full bg-background border-2 border-on-surface px-4 py-3 text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all uppercase placeholder:text-on-surface-variant/30"
              placeholder="E.G. TRADITIONAL TAGINES"
            />
          </div>

          <div className="space-y-2">
            <label className="text-ui-label-bold text-[10px] text-on-surface-variant flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-primary"  strokeWidth={2.5}/>
                <span>SECTOR CONTEXT</span>
            </label>
            <textarea 
              data-testid="category-description-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border-2 border-on-surface px-4 py-3 text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all resize-none uppercase placeholder:text-on-surface-variant/30"
              placeholder="CULINARY INTENT..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-ui-label-bold text-[10px] text-on-surface-variant flex items-center gap-2">
                <ListOrdered className="w-3.5 h-3.5 text-primary"  strokeWidth={2.5}/>
                <span>PRIORITY RANK</span>
            </label>
            <input 
              type="number" 
              data-testid="category-order-input"
              value={ordre}
              onChange={(e) => setOrdre(parseInt(e.target.value) || 0)}
              className="w-full bg-background border-2 border-on-surface px-4 py-3 text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-ui-label-bold text-[10px] text-on-surface-variant flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-primary"  strokeWidth={2.5}/>
                <span>VISUAL ASSET INJECTION</span>
            </label>
            <div className="relative group">
              <input 
                type="file" 
                data-testid="category-image-input"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-40 bg-surface-container border-2 border-dashed border-on-surface flex flex-col items-center justify-center gap-4 transition-all group-hover:bg-primary/5 group-hover:border-primary">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-on-surface-variant opacity-20" />
                    <span className="text-ui-label-bold text-[9px] text-on-surface-variant opacity-60">SELECT DATA FILE</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            data-testid="category-save-button"
            disabled={isSaving}
            className="w-full py-4 bg-primary text-on-primary border-2 border-on-surface text-ui-button font-ui-button shadow-[4px_4px_0px_#301400] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#301400] transition-all active:translate-y-[2px] active:shadow-none mt-4"
          >
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin mx-auto"  strokeWidth={2.5}/> : (
                <div className="flex items-center justify-center gap-3 uppercase tracking-[0.2em] font-black">
                    <span>{editingCategory ? 'Commit Changes' : 'Architect Sector'}</span>
                    <CheckCircle2 className="w-5 h-5"  strokeWidth={2.5}/>
                </div>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};
