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
  Search,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface RecipeItem {
  localId: string;
  id: number | null;
  ingredientId: string;
  quantiteRequise: string;
}

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
  recipeItems: RecipeItem[];
  originalRecipeIds: number[];
  isRecipeLoading: boolean;
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
  recipeItems: [],
  originalRecipeIds: [],
  isRecipeLoading: false,
};

const makeRecipeItem = (ingredientId = '', quantiteRequise = '', id: number | null = null): RecipeItem => ({
  localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  id,
  ingredientId,
  quantiteRequise,
});

export const PlatPage: React.FC = () => {
  const [plats, setPlats] = useState<Plat[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedPlats, setHasLoadedPlats] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 12;

  const fetchCategories = async () => {
    try {
      const catsRes = await menuApi.getCategories();
      setCategories(catsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Erreur chargement catégories');
    }
  };

  const fetchIngredients = async () => {
    try {
      const res = await stockApi.getIngredients({ est_active: true });
      setIngredients(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Erreur chargement ingrédients');
    }
  };

  const fetchPlats = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const platsRes = await menuApi.getPlatsPage({
        page,
        page_size: itemsPerPage,
        search: search.trim() || undefined,
      });
      setPlats(platsRes.data.results);
      setTotalCount(platsRes.data.count);
    } catch (err) {
      console.error(err);
      toast.error('Erreur chargement catalogue');
    } finally {
      setIsLoading(false);
      setHasLoadedPlats(true);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchIngredients();
  }, []);

  useEffect(() => {
    fetchPlats();
  }, [currentPage, search]);

  const openCreate = () => {
    setSaveError(null);
    setDeleteError(null);
    setEditor({ ...BLANK_EDITOR, categorieId: categories[0] ? String(categories[0].id) : '', recipeItems: [] });
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
      recipeItems: [],
      originalRecipeIds: [],
      isRecipeLoading: true,
    });
    if (imageInputRef.current) imageInputRef.current.value = '';
    stockApi.getPlatIngredients({ plat: plat.id })
      .then((res) => {
        const recipeItems = res.data.map(item => makeRecipeItem(String(item.ingredient), item.quantite_requise, item.id));
        setEditor(prev => prev?.id === plat.id ? {
          ...prev,
          recipeItems,
          originalRecipeIds: res.data.map(item => item.id),
          isRecipeLoading: false,
        } : prev);
      })
      .catch((err) => {
        console.error(err);
        setEditor(prev => prev?.id === plat.id ? { ...prev, isRecipeLoading: false } : prev);
        toast.error('Erreur chargement recette');
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

  const addRecipeItem = () => {
    setEditor(prev => prev ? {
      ...prev,
      recipeItems: [...prev.recipeItems, makeRecipeItem(ingredients[0] ? String(ingredients[0].id) : '', '1')],
    } : prev);
  };

  const updateRecipeItem = (localId: string, patch: Partial<RecipeItem>) => {
    setEditor(prev => prev ? {
      ...prev,
      recipeItems: prev.recipeItems.map(item => item.localId === localId ? { ...item, ...patch } : item),
    } : prev);
  };

  const removeRecipeItem = (localId: string) => {
    setEditor(prev => prev ? {
      ...prev,
      recipeItems: prev.recipeItems.filter(item => item.localId !== localId),
    } : prev);
  };

  const validateRecipe = (recipeItems: RecipeItem[]) => {
    const selectedIds = recipeItems.map(item => item.ingredientId).filter(Boolean);
    if (selectedIds.length !== recipeItems.length || recipeItems.some(item => !item.quantiteRequise || Number(item.quantiteRequise) <= 0)) {
      return 'Chaque ingrédient de recette doit avoir une quantité positive.';
    }
    if (new Set(selectedIds).size !== selectedIds.length) {
      return 'Un ingrédient ne peut pas être ajouté deux fois au même plat.';
    }
    return null;
  };

  const syncRecipe = async (platId: number, editorState: EditorState) => {
    const currentIds = editorState.recipeItems
      .map(item => item.id)
      .filter((id): id is number => id !== null);
    const removedIds = editorState.originalRecipeIds.filter(id => !currentIds.includes(id));

    await Promise.all(removedIds.map(id => stockApi.deletePlatIngredient(id)));
    await Promise.all(editorState.recipeItems.map((item) => {
      const payload: Partial<PlatIngredient> = {
        plat: platId,
        ingredient: Number(item.ingredientId),
        quantite_requise: item.quantiteRequise,
      };
      return item.id
        ? stockApi.updatePlatIngredient(item.id, payload)
        : stockApi.createPlatIngredient(payload);
    }));
  };

  const handleSave = async () => {
    if (!editor) return;
    const recipeError = validateRecipe(editor.recipeItems);
    if (recipeError) {
      setSaveError(recipeError);
      return;
    }
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

      let savedPlat: Plat | null = null;
      if (editor.mode === 'create') {
        const res = await menuApi.createPlat(formData);
        savedPlat = res.data;
      } else if (editor.id !== null) {
        const res = await menuApi.updatePlat(editor.id, formData);
        savedPlat = res.data;
      }
      if (savedPlat) {
        if (editor.mode === 'create') {
          setEditor(prev => prev ? { ...prev, mode: 'edit', id: savedPlat.id } : prev);
        }
        await syncRecipe(savedPlat.id, editor);
      }
      setCurrentPage(1);
      await fetchPlats(1);
      closeEditor();
    } catch (err) {
      setSaveError("Impossible d'enregistrer le plat.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteError(null);
    try {
      await menuApi.deletePlat(id);
      if (plats.length === 1 && currentPage > 1) {
        setCurrentPage(page => page - 1);
      } else {
        await fetchPlats();
      }
    } catch (err) {
      setDeleteError('Suppression impossible.');
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  if (isLoading && !hasLoadedPlats) return <div className="h-full flex items-center justify-center text-on-background"><Loader2 className="w-8 h-8 animate-spin" strokeWidth={1}/></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-body selection:bg-on-background/10 overflow-hidden">
      <header className="flex-none flex flex-wrap justify-between items-center px-4 md:px-8 py-3 md:py-0 min-h-20 border-b border-outline bg-surface gap-3">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center md:gap-4">
          <div className="relative group w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-on-background transition-colors" />
            <input
              type="text"
              aria-label="Rechercher un plat"
              placeholder="Rechercher un plat..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="field-control w-full sm:w-56 pl-10 pr-4 text-[10px] uppercase"
            />
          </div>
          <button data-testid="plat-create-button" onClick={openCreate} className="btn-primary h-10 px-6">
            <Plus className="w-4 h-4" /> <span>Nouvelle Fiche</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        {isLoading && (
          <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
            Recherche en cours
          </div>
        )}
        {deleteError && (
          <p role="alert" className="form-error mb-4">{deleteError}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {plats.map(p => (
            <div key={p.id} data-testid={`plat-card-${p.id}`} className="atelier-card p-4 group">
              <div className="relative aspect-video rounded border border-outline overflow-hidden bg-background mb-4">
                {p.image ? (
                  <img src={p.image} className="w-full h-full object-cover" alt={p.nom} role="img" aria-label={p.nom} loading="lazy" decoding="async" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-10"><ImageIcon className="w-8 h-8" /></div>
                )}
              </div>
              <h3 className="text-[13px] font-bold uppercase tracking-tight text-on-background truncate">{p.nom}</h3>
              <div className="mt-4 flex justify-between items-end">
                <span className="font-mono text-sm font-bold text-on-background">{parseFloat(p.prix).toFixed(0)} DH</span>
                <div className="flex gap-2">
                  <button data-testid={`plat-edit-${p.id}`} aria-label={`Modifier ${p.nom}`} onClick={() => openEdit(p)} className="btn-icon"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button data-testid={`plat-delete-${p.id}`} aria-label={`Supprimer ${p.nom}`} onClick={() => handleDelete(p.id)} className="btn-icon text-error hover:border-error/30 hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-outline pt-4">
          <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
            Total : {totalCount} plats
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <button aria-label="Page précédente" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-icon"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-on-surface-variant">
                <span className="text-on-background">{currentPage}</span>
                <span>/</span>
                <span>{totalPages}</span>
              </div>
              <button aria-label="Page suivante" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-icon"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
      </main>

      {editor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={closeEditor} />
          <div role="dialog" aria-modal="true" aria-labelledby="plat-editor-title" className="relative w-full max-w-md h-full bg-surface border-l border-outline flex flex-col shadow-2xl">
            <div className="p-6 border-b border-outline flex items-center justify-between">
              <h2 id="plat-editor-title" className="text-sm font-bold text-on-background uppercase tracking-[0.2em]">
                {editor.mode === 'create' ? 'Nouvelle Fiche' : 'Modifier Fiche'}
              </h2>
              <button aria-label="Fermer l'éditeur" onClick={closeEditor} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
              {saveError && (
                <p id="plat-save-error" role="alert" className="form-error">{saveError}</p>
              )}
              <div className="space-y-2">
                <label htmlFor="plat-nom" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nom</label>
                <input
                  id="plat-nom"
                  data-testid="plat-name-input"
                  value={editor.nom}
                  onChange={e => setEditor(prev => prev ? { ...prev, nom: e.target.value } : prev)}
                  aria-invalid={Boolean(saveError)}
                  aria-describedby={saveError ? 'plat-save-error' : undefined}
                  className="field-control"
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
                  className="field-control"
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
                  className="field-control min-h-28 py-3 resize-none"
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
                  className="field-control"
                />
              </div>
              {categories.length > 0 && (
                <div className="space-y-2">
                  <label htmlFor="plat-categorie" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Catégorie</label>
                  <select
                    id="plat-categorie"
                    value={editor.categorieId}
                    onChange={e => setEditor(prev => prev ? { ...prev, categorieId: e.target.value } : prev)}
                    className="field-control"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ingrédients</label>
                  <button
                    type="button"
                    data-testid="plat-add-ingredient-button"
                    onClick={addRecipeItem}
                    disabled={ingredients.length === 0 || editor.isRecipeLoading}
                    className="btn-icon"
                    aria-label="Ajouter un ingrédient au plat"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {editor.isRecipeLoading ? (
                  <div className="h-16 border border-outline rounded flex items-center justify-center text-on-surface-variant">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : editor.recipeItems.length > 0 ? (
                  <div className="space-y-3" data-testid="plat-ingredients-list">
                    {editor.recipeItems.map((item, index) => {
                      const ingredient = ingredients.find(i => String(i.id) === item.ingredientId);
                      return (
                        <div key={item.localId} className="grid grid-cols-[1fr_8.5rem_2.75rem] gap-2 items-end">
                          <div className="space-y-1">
                            <label htmlFor={`plat-ingredient-${item.localId}`} className="sr-only">Ingrédient {index + 1}</label>
                            <select
                              id={`plat-ingredient-${item.localId}`}
                              data-testid={`plat-ingredient-select-${index}`}
                              value={item.ingredientId}
                              onChange={e => updateRecipeItem(item.localId, { ingredientId: e.target.value })}
                              className="field-control text-[11px]"
                            >
                              <option value="">Choisir</option>
                              {ingredients.map(ingredientOption => (
                                <option key={ingredientOption.id} value={ingredientOption.id}>
                                  {ingredientOption.nom}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label htmlFor={`plat-ingredient-qty-${item.localId}`} className="sr-only">Quantité requise</label>
                            <div className="relative">
                              <input
                                id={`plat-ingredient-qty-${item.localId}`}
                                data-testid={`plat-ingredient-qty-${index}`}
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={item.quantiteRequise}
                                onChange={e => updateRecipeItem(item.localId, { quantiteRequise: e.target.value })}
                                className="field-control pr-8 text-[11px]"
                              />
                              {ingredient && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-on-surface-variant uppercase">
                                  {ingredient.unite_mesure}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            data-testid={`plat-remove-ingredient-${index}`}
                            onClick={() => removeRecipeItem(item.localId)}
                            className="btn-icon text-error hover:border-error/30 hover:text-error"
                            aria-label={`Retirer l'ingrédient ${index + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="border border-dashed border-outline rounded p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                    Aucun ingrédient lié à ce plat.
                  </p>
                )}

                {ingredients.length === 0 && (
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                    Crée d'abord des ingrédients dans le stock.
                  </p>
                )}
              </div>
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
                  <p className="text-[10px] font-bold text-on-background uppercase tracking-widest">Image chargée</p>
                )}
                {editor.imagePreviewUrl && (
                  <div className="mt-2 aspect-video rounded border border-outline overflow-hidden">
                    <img src={editor.imagePreviewUrl} alt="Aperçu du plat" className="w-full h-full object-cover" />
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
