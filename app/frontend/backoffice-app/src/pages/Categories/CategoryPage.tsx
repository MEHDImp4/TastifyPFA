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
    <div className="max-w-7xl mx-auto animate-in fade-in duration-700 bg-background">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface font-sans">Menu Architecture</h1>
          <p className="text-on-surface-variant mt-1.5 font-sans font-medium">Manage the structural categories of your restaurant's menu.</p>
        </div>
        <button 
          data-testid="category-create-button"
          onClick={() => handleOpenModal()}
          className="flex items-center gap-3 px-6 py-3.5 bg-primary text-white rounded-none font-bold transition-all hover:scale-[1.02] hover:shadow-[2px_2px_0px_rgba(15,23,42,0.1)] hover:shadow-primary/20 active:scale-95 shadow-[2px_2px_0px_rgba(15,23,42,0.1)] shadow-primary/10"
        >
          <Plus className="w-5 h-5"  strokeWidth={1.5}/>
          <span>Define New Category</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.filter(c => c.est_active).map((cat) => (
            <div 
              key={cat.id}
              data-testid={`category-card-${cat.id}`}
              className="group double-bezel bg-white p-3 transition-all duration-500 hover:scale-[1.02] hover:shadow-[2px_2px_0px_rgba(15,23,42,0.1)] hover:shadow-primary/5"
            >
              <div className="aspect-[16/10] relative rounded-none overflow-hidden bg-surface-container-low mb-5">
                {cat.image ? (
                  <img src={cat.image} alt={cat.nom} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant opacity-20">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <button 
                    data-testid={`category-edit-${cat.id}`}
                    onClick={() => handleOpenModal(cat)}
                    className="p-3 bg-white/80 backdrop-blur-xl rounded-none text-on-surface hover:text-primary shadow-[2px_2px_0px_rgba(15,23,42,0.1)] transition-all active:scale-90"
                  >
                    <Edit2 className="w-4 h-4"  strokeWidth={1.5}/>
                  </button>
                  <button 
                    data-testid={`category-delete-${cat.id}`}
                    onClick={() => handleDelete(cat.id)}
                    className="p-3 bg-white/80 backdrop-blur-xl rounded-none text-on-surface hover:text-error shadow-[2px_2px_0px_rgba(15,23,42,0.1)] transition-all active:scale-90"
                  >
                    <Trash2 className="w-4 h-4"  strokeWidth={1.5}/>
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 glass px-4 py-2 rounded-none text-xs font-bold text-on-surface uppercase tracking-widest font-mono border border-primary/10">
                    Rank: #{cat.ordre_affichage}
                </div>
              </div>
              <div className="px-3 pb-3">
                <h3 className="text-2xl font-bold tracking-tight text-on-surface font-sans mb-3">{cat.nom}</h3>
                <p className="text-on-surface-variant text-sm font-medium leading-relaxed line-clamp-2 h-10 opacity-70">
                  {cat.description || 'No description provided for this culinary sector.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingCategory ? 'Update Sector' : 'Define Sector'}
      >
        <form onSubmit={handleSubmit} className="space-y-8 p-2">
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <FileText className="w-3 h-3 text-primary"  strokeWidth={1.5}/>
                <span>Identification</span>
            </label>
            <input 
              type="text" 
              data-testid="category-name-input"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full bg-surface-container-low border border-surface-container-high rounded-none px-5 py-4 text-on-surface font-bold focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
              placeholder="Ex: Signature Starters, Traditional Tagines..."
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <ImageIcon className="w-3 h-3 text-primary" />
                <span>Sector Context</span>
            </label>
            <textarea 
              data-testid="category-description-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-container-low border border-surface-container-high rounded-none px-5 py-4 text-on-surface font-semibold focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none"
              placeholder="Describe the culinary intent of this category..."
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <ListOrdered className="w-3 h-3 text-primary"  strokeWidth={1.5}/>
                <span>Architectural Rank</span>
            </label>
            <input 
              type="number" 
              data-testid="category-order-input"
              value={ordre}
              onChange={(e) => setOrdre(parseInt(e.target.value) || 0)}
              className="w-full bg-surface-container-low border border-surface-container-high rounded-none px-5 py-4 text-on-surface font-bold focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <ImageIcon className="w-3 h-3 text-primary" />
                <span>Visual Asset</span>
            </label>
            <div className="relative group">
              <input 
                type="file" 
                data-testid="category-image-input"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-40 bg-surface-container-low border-2 border-dashed border-surface-container-high rounded-none flex flex-col items-center justify-center gap-3 transition-all group-hover:border-primary/40 group-hover:bg-primary-container/5">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-none" />
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-on-surface-variant opacity-20" />
                    <span className="text-xs font-bold text-on-surface-variant opacity-60 uppercase tracking-widest font-mono">Inject Visual Data</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            data-testid="category-save-button"
            disabled={isSaving}
            className="w-full py-5 mt-4 bg-primary text-white rounded-none font-bold text-lg transition-all hover:scale-[1.02] hover:shadow-[2px_2px_0px_rgba(15,23,42,0.1)] hover:shadow-primary/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin"  strokeWidth={1.5}/> : (
                <>
                    <span>{editingCategory ? 'Update Architecture' : 'Confirm Category'}</span>
                    <CheckCircle2 className="w-6 h-6"  strokeWidth={1.5}/>
                </>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};
