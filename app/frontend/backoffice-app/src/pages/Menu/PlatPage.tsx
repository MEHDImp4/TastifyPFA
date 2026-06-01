import React, { useState, useEffect, useRef } from 'react';
import { menuApi } from '../../api/menu';
import type { Plat, Categorie } from '../../types/menu';
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface EditorState {
  mode: 'create' | 'edit';
  id: number | null;
  nom: string;
  prix: string;
  description: string;
  tempsPrep: string;
  categorieId: string;
  image: File | null;
  imagePreviewUrl: string | null;
}

const BLANK_EDITOR: EditorState = {
  mode: 'create',
  id: null,
  nom: '',
  prix: '',
  description: '',
  tempsPrep: '15',
  categorieId: '',
  image: null,
  imagePreviewUrl: null,
};

export const PlatPage: React.FC = () => {
  const [plats, setPlats] = useState<Plat[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    try {
      const [platsRes, catsRes] = await Promise.all([menuApi.getPlats(), menuApi.getCategories()]);
      setPlats(platsRes.data);
      setCategories(catsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Erreur chargement catalogue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openCreate = () => {
    setSaveError(null);
    setDeleteError(null);
    setEditor({ ...BLANK_EDITOR, categorieId: categories[0] ? String(categories[0].id) : '' });
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const openEdit = (plat: Plat) => {
    setSaveError(null);
    setDeleteError(null);
    setEditor({
      mode: 'edit',
      id: plat.id,
      nom: plat.nom,
      prix: plat.prix,
      description: plat.description ?? '',
      tempsPrep: String(plat.temps_preparation),
      categorieId: plat.categorie ? String(plat.categorie) : '',
      image: null,
      imagePreviewUrl: plat.image ?? null,
    });
    if (imageInputRef.current) imageInputRef.current.value = '';
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
      formData.append('prix', editor.prix);
      formData.append('description', editor.description);
      formData.append('temps_preparation', editor.tempsPrep);
      formData.append('est_active', 'true');
      formData.append('est_disponible', 'true');
      if (editor.categorieId) formData.append('categorie', editor.categorieId);
      if (editor.image) formData.append('image', editor.image);

      if (editor.mode === 'create') {
        await menuApi.createPlat(formData);
      } else if (editor.id !== null) {
        await menuApi.updatePlat(editor.id, formData);
      }
      await fetchAll();
      closeEditor();
    } catch (err) {
      setSaveError('Commit failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteError(null);
    try {
      await menuApi.deletePlat(id);
      setPlats(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setDeleteError('Deletion error');
    }
  };

  const filteredPlats = plats.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div className="h-full flex items-center justify-center text-on-background"><Loader2 className="w-8 h-8 animate-spin" strokeWidth={1}/></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-body selection:bg-on-background/10 overflow-hidden">
      <header className="flex-none flex justify-between items-center px-8 h-20 border-b border-outline bg-surface">
        <h2 className="sr-only">Menu Operations</h2>
        <div>
          <h1 className="text-sm font-bold tracking-widest text-on-background uppercase">Catalogue des Plats</h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-40">Gestion de l'offre gastronomique</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-on-background transition-colors" />
            <input
              type="text"
              placeholder="SEARCH CATALOG..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 h-10 bg-background border border-outline pl-10 pr-4 rounded text-[10px] font-bold text-on-background focus:border-on-background outline-none transition-all uppercase placeholder:text-on-surface-variant/30"
            />
          </div>
          <button data-testid="plat-create-button" onClick={openCreate} className="btn-primary h-10 px-6">
            <Plus className="w-4 h-4" /> <span>Nouvelle Fiche</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {deleteError && (
          <p className="mb-4 text-[10px] font-bold text-error uppercase tracking-widest">{deleteError}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlats.map(p => (
            <div key={p.id} data-testid={`plat-card-${p.id}`} className="atelier-card p-4 group">
              <div className="relative aspect-video rounded border border-outline overflow-hidden bg-background mb-4">
                {p.image ? (
                  <img src={p.image} className="w-full h-full object-cover" alt={p.nom} role="img" aria-label={p.nom} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-10"><ImageIcon className="w-8 h-8" /></div>
                )}
              </div>
              <h3 className="text-[13px] font-bold uppercase tracking-tight text-on-background truncate">{p.nom}</h3>
              <div className="mt-4 flex justify-between items-end">
                <span className="font-mono text-sm font-bold text-on-background">{parseFloat(p.prix).toFixed(0)} DH</span>
                <div className="flex gap-2">
                  <button data-testid={`plat-edit-${p.id}`} onClick={() => openEdit(p)} className="p-2 hover:bg-surface-container-high rounded text-on-surface-variant"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button data-testid={`plat-delete-${p.id}`} onClick={() => handleDelete(p.id)} className="p-2 hover:bg-error/5 rounded text-error"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {editor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={closeEditor} />
          <div className="relative w-full max-w-md h-full bg-surface border-l border-outline flex flex-col shadow-2xl">
            <div className="p-6 border-b border-outline flex items-center justify-between">
              <h2 className="text-sm font-bold text-on-background uppercase tracking-[0.2em]">
                {editor.mode === 'create' ? 'Nouvelle Fiche' : 'Modifier Fiche'}
              </h2>
              <button onClick={closeEditor} className="p-2 hover:bg-surface-container-high rounded text-on-surface-variant">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
              {saveError && (
                <p className="text-[10px] font-bold text-error uppercase tracking-widest">{saveError}</p>
              )}
              <div className="space-y-2">
                <label htmlFor="plat-nom" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nom</label>
                <input
                  id="plat-nom"
                  data-testid="plat-name-input"
                  value={editor.nom}
                  onChange={e => setEditor(prev => prev ? { ...prev, nom: e.target.value } : prev)}
                  className="w-full h-12 bg-background border border-outline rounded-md px-4 font-bold text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="plat-prix" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Prix (DH)</label>
                <input
                  id="plat-prix"
                  data-testid="plat-price-input"
                  type="number"
                  step="0.01"
                  value={editor.prix}
                  onChange={e => setEditor(prev => prev ? { ...prev, prix: e.target.value } : prev)}
                  className="w-full h-12 bg-background border border-outline rounded-md px-4 font-bold text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="plat-description" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Description</label>
                <textarea
                  id="plat-description"
                  data-testid="plat-description-input"
                  value={editor.description}
                  onChange={e => setEditor(prev => prev ? { ...prev, description: e.target.value } : prev)}
                  rows={3}
                  className="w-full bg-background border border-outline rounded-md px-4 py-3 font-bold text-sm resize-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="plat-temps" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Temps de prép. (min)</label>
                <input
                  id="plat-temps"
                  data-testid="plat-time-input"
                  type="number"
                  value={editor.tempsPrep}
                  onChange={e => setEditor(prev => prev ? { ...prev, tempsPrep: e.target.value } : prev)}
                  className="w-full h-12 bg-background border border-outline rounded-md px-4 font-bold text-sm"
                />
              </div>
              {categories.length > 0 && (
                <div className="space-y-2">
                  <label htmlFor="plat-categorie" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Catégorie</label>
                  <select
                    id="plat-categorie"
                    value={editor.categorieId}
                    onChange={e => setEditor(prev => prev ? { ...prev, categorieId: e.target.value } : prev)}
                    className="w-full h-12 bg-background border border-outline rounded-md px-4 font-bold text-sm"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="plat-image" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Image</label>
                <input
                  id="plat-image"
                  data-testid="plat-image-input"
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-sm"
                />
                {editor.image && (
                  <p className="text-[10px] font-bold text-on-background uppercase tracking-widest">FILE LOADED</p>
                )}
                {editor.imagePreviewUrl && (
                  <div className="mt-2 aspect-video rounded border border-outline overflow-hidden">
                    <img src={editor.imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-outline flex gap-3">
              <button onClick={closeEditor} className="flex-1 h-12 border border-outline rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-background transition-all">Annuler</button>
              <button
                data-testid="plat-save-button"
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
