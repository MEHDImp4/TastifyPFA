import React, { useState, useEffect, useRef } from 'react';
import { menuApi } from '../../api/menu';
import type { Categorie } from '../../types/menu';
import {
  Plus,
  Trash2,
  Loader2,
  Search,
  Edit2,
  X
} from 'lucide-react';
import { toast } from 'sonner';

type EditorMode = 'create' | 'edit';

interface EditorState {
  mode: EditorMode;
  id: number | null;
  nom: string;
  description: string;
  ordre: string;
  image: File | null;
  imagePreviewUrl: string | null;
}

const BLANK_EDITOR = (nextOrder: number): EditorState => ({
  mode: 'create',
  id: null,
  nom: '',
  description: '',
  ordre: String(nextOrder),
  image: null,
  imagePreviewUrl: null,
});

export const CategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = async () => {
    try {
      const res = await menuApi.getCategories();
      setCategories(res.data.sort((a, b) => a.ordre_affichage - b.ordre_affichage));
    } catch (err) {
      console.error(err);
      toast.error('Erreur chargement secteurs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    const nextOrder = categories.length > 0
      ? Math.max(...categories.map(c => c.ordre_affichage)) + 1
      : 1;
    setSaveError(null);
    setEditor(BLANK_EDITOR(nextOrder));
  };

  const openEdit = (cat: Categorie) => {
    setSaveError(null);
    setEditor({
      mode: 'edit',
      id: cat.id,
      nom: cat.nom,
      description: cat.description ?? '',
      ordre: String(cat.ordre_affichage),
      image: null,
      imagePreviewUrl: cat.image ?? null,
    });
  };

  const closeEditor = () => {
    setEditor(null);
    setSaveError(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file || !editor) return;
    const url = URL.createObjectURL(file);
    setEditor(prev => prev ? { ...prev, image: file, imagePreviewUrl: url } : prev);
  };

  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const formData = new FormData();
      formData.append('nom', editor.nom);
      formData.append('description', editor.description);
      formData.append('ordre_affichage', editor.ordre);
      formData.append('est_active', 'true');
      if (editor.image) formData.append('image', editor.image);

      if (editor.mode === 'create') {
        await menuApi.createCategory(formData);
      } else if (editor.id !== null) {
        await menuApi.updateCategory(editor.id, formData);
      }
      await fetchCategories();
      closeEditor();
    } catch (err) {
      setSaveError("Impossible d'enregistrer la catégorie.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await menuApi.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      toast.error('Suppression impossible');
    }
  };

  if (isLoading) return <div className="h-full flex items-center justify-center text-on-background"><Loader2 className="w-8 h-8 animate-spin" strokeWidth={1} /></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-body selection:bg-on-background/10 overflow-hidden">
      <header className="flex-none flex flex-wrap justify-between items-center px-4 md:px-8 py-3 md:py-0 min-h-20 border-b border-outline bg-surface gap-3">
        <div>
          <h1 aria-label="Gestion des catégories" className="text-sm font-bold tracking-widest text-on-background uppercase">Secteurs & Catégories</h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-40">Organisation hiérarchique du menu</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center md:gap-4">
          <div className="relative group w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-on-background transition-colors" />
            <input
              type="text"
              aria-label="Rechercher une catégorie"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field-control w-full sm:w-56 pl-10 pr-4 text-[10px] uppercase"
            />
          </div>
          <button data-testid="category-create-button" onClick={openCreate} className="btn-primary h-10 px-6">
            <Plus className="w-4 h-4" /> <span>Nouveau Secteur</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.filter(c => c.nom.toLowerCase().includes(search.toLowerCase())).map(c => (
            <div key={c.id} data-testid={`category-card-${c.id}`} className="atelier-card p-6 group">
              {c.image && (
                <div className="mb-4 aspect-video rounded overflow-hidden border border-outline">
                  <img src={c.image} alt={c.nom} role="img" aria-label={c.nom} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded border border-outline bg-background flex items-center justify-center font-bold text-[10px]">{c.ordre_affichage}</div>
                  <h3 className="text-sm font-bold uppercase tracking-tight text-on-background">{c.nom}</h3>
                </div>
                <div className="flex gap-2">
                  <button data-testid={`category-edit-${c.id}`} aria-label={`Modifier ${c.nom}`} onClick={() => openEdit(c)} className="btn-icon"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button data-testid={`category-delete-${c.id}`} aria-label={`Supprimer ${c.nom}`} onClick={() => handleDelete(c.id)} className="btn-icon text-error hover:border-error/30 hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="text-[10px] text-on-surface-variant leading-relaxed line-clamp-2 uppercase tracking-widest opacity-40">{c.description || 'Aucune description spécifiée.'}</p>
            </div>
          ))}
        </div>
      </main>

      {editor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={closeEditor} />
          <div role="dialog" aria-modal="true" aria-labelledby="category-editor-title" className="relative w-full max-w-md bg-surface border border-outline rounded-xl flex flex-col shadow-2xl">
            <div className="p-6 border-b border-outline flex items-center justify-between">
              <h2 id="category-editor-title" className="text-sm font-bold text-on-background uppercase tracking-[0.2em]">
                {editor.mode === 'create' ? 'Nouveau Secteur' : 'Modifier Secteur'}
              </h2>
              <button data-testid="close-editor" aria-label="Fermer l'éditeur" onClick={closeEditor} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              {saveError && (
                <p id="category-save-error" role="alert" className="form-error">{saveError}</p>
              )}
              <div className="space-y-2">
                <label htmlFor="cat-nom" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nom</label>
                <input
                  id="cat-nom"
                  data-testid="category-name-input"
                  value={editor.nom}
                  onChange={e => setEditor(prev => prev ? { ...prev, nom: e.target.value } : prev)}
                  aria-invalid={Boolean(saveError)}
                  aria-describedby={saveError ? 'category-save-error' : undefined}
                  className="field-control"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="cat-description" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Description</label>
                <textarea
                  id="cat-description"
                  data-testid="category-description-input"
                  value={editor.description}
                  onChange={e => setEditor(prev => prev ? { ...prev, description: e.target.value } : prev)}
                  rows={3}
                  className="field-control min-h-28 py-3 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="cat-ordre" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ordre d'affichage</label>
                <input
                  id="cat-ordre"
                  data-testid="category-order-input"
                  type="number"
                  value={editor.ordre}
                  onChange={e => setEditor(prev => prev ? { ...prev, ordre: e.target.value } : prev)}
                  className="field-control"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="cat-image" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Image</label>
                <input
                  id="cat-image"
                  data-testid="category-image-input"
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-sm"
                />
                {editor.imagePreviewUrl && (
                  <div data-testid="category-image-preview" className="mt-2 aspect-video rounded border border-outline overflow-hidden">
                    <img src={editor.imagePreviewUrl} alt="Aperçu de la catégorie" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-outline flex gap-3">
              <button onClick={closeEditor} className="flex-1 h-12 border border-outline rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-background transition-all">Annuler</button>
              <button
                data-testid="category-save-button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[2] btn-primary h-12"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Enregistrer</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
