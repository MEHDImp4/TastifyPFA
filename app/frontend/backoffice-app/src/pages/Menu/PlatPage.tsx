import React, { useState, useEffect } from 'react';
import { menuApi } from '../../api/menu';
import { stockApi } from '../../api/inventory_hr';
import type { Plat, Categorie } from '../../types/menu';
import type { Ingredient, PlatIngredient } from '../../types/inventory';
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2, Clock, Minus, ChefHat, Tag, DollarSign, Timer, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'sonner';

import { CardSkeleton } from '../../components/ui/Skeleton';

export const PlatPage: React.FC = () => {
  const [plats, setPlats] = useState<Plat[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [platIngredients, setPlatIngredients] = useState<PlatIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlat, setEditingPlat] = useState<Plat | null>(null);
  
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
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (plat?: Plat) => {
    if (plat) {
      setEditingPlat(plat);
      setNom(plat.nom);
      setDescription(plat.description);
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
    setIsModalOpen(true);
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
      
      // Save ingredients
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

      toast.success('Plat enregistré avec succès');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save plat', err);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce plat ?')) {
      try {
        await menuApi.deletePlat(id);
        toast.success('Plat supprimé');
        fetchData();
      } catch (err) {
        console.error('Failed to delete plat', err);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const getCategoryName = (id: number) => {
    return categories.find(c => c.id === id)?.nom || 'Uncategorized';
  };

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-display-lg text-[32px] text-on-surface leading-none">Culinary Catalog</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-secondary"></div>
            <span className="text-ui-data-dense uppercase tracking-widest text-on-surface-variant font-bold">Signature Dish & Technical Recipe Registry</span>
          </div>
        </div>
        <button 
          data-testid="plat-create-button"
          onClick={() => handleOpenModal()}
          className="flex items-center gap-3 px-6 py-3 bg-primary text-on-primary border-2 border-on-surface text-ui-button font-ui-button shadow-[4px_4px_0px_#301400] transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#301400] active:translate-y-[2px] active:shadow-none"
        >
          <Plus className="w-5 h-5"  strokeWidth={2.5}/>
          <span>DEFINE NEW CREATION</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {plats.filter(p => p.est_active).map((plat) => (
            <div 
              key={plat.id}
              data-testid={`plat-card-${plat.id}`}
              className="group bg-surface-container border-2 border-on-surface p-4 transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#301400] cursor-default"
            >
              <div className="aspect-[4/3] relative border-2 border-on-surface bg-background mb-6 overflow-hidden">
                {plat.image ? (
                  <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0 transition-all duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface/5 font-serif italic text-6xl">
                    {plat.nom.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    data-testid={`plat-edit-${plat.id}`}
                    onClick={() => handleOpenModal(plat)}
                    className="p-3 bg-background border-2 border-on-surface text-on-surface hover:bg-primary hover:text-on-primary transition-all active:scale-90"
                  >
                    <Edit2 className="w-4 h-4"  strokeWidth={2.5}/>
                  </button>
                  <button 
                    data-testid={`plat-delete-${plat.id}`}
                    onClick={() => handleDelete(plat.id)}
                    className="p-3 bg-background border-2 border-on-surface text-on-surface hover:bg-error hover:text-on-error transition-all active:scale-90"
                  >
                    <Trash2 className="w-4 h-4"  strokeWidth={2.5}/>
                  </button>
                </div>

                {/* Price Badge */}
                <div className="absolute bottom-2 left-2 bg-primary text-on-primary px-3 py-1 text-ui-label-bold text-[10px] shadow-[3px_3px_0px_#301400]">
                    {plat.prix} DH
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.25em]">
                  {getCategoryName(plat.categorie).toUpperCase()}
                </p>
                <h3 className="text-ui-label-bold text-base text-on-surface font-black uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                  {plat.nom}
                </h3>
                
                <div className="flex items-center gap-4 border-y-2 border-on-surface/5 py-3">
                  <div className="flex items-center gap-2 text-ui-data-dense font-black text-on-surface-variant uppercase tracking-widest">
                    <Timer className="w-3.5 h-3.5"  strokeWidth={2.5}/>
                    <span>{plat.temps_preparation}M VELOCITY</span>
                  </div>
                </div>

                <p className="text-ui-data-dense font-black text-on-surface-variant opacity-60 leading-relaxed line-clamp-2 h-10 italic">
                  {plat.description?.toUpperCase() || 'NO CULINARY CONTEXT LOGGED.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingPlat ? 'REFINE CREATION METADATA' : 'ARCHITECT NEW CREATION'}
      >
        <form onSubmit={handleSubmit} className="space-y-6 p-2 max-h-[75vh] overflow-y-auto pr-4 scrollbar-hide">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2 sm:col-span-2">
                <label className="text-ui-label-bold text-[10px] text-on-surface-variant flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-primary"  strokeWidth={2.5}/>
                    <span>IDENTIFICATION</span>
                </label>
                <input 
                    type="text" 
                    data-testid="plat-name-input"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full bg-background border-2 border-on-surface px-4 py-3 text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all uppercase placeholder:text-on-surface-variant/30"
                    placeholder="E.G. MOROCCAN SPICED SALMON"
                />
            </div>

            <div className="space-y-2">
                <label className="text-ui-label-bold text-[10px] text-on-surface-variant flex items-center gap-2">
                    <ChefHat className="w-3.5 h-3.5 text-primary"  strokeWidth={2.5}/>
                    <span>SECTOR ALLOCATION</span>
                </label>
                <select 
                    data-testid="plat-category-select"
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(parseInt(e.target.value))}
                    className="w-full bg-background border-2 border-on-surface px-4 py-3 text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all"
                >
                {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.nom.toUpperCase()}</option>
                ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-ui-label-bold text-[10px] text-on-surface-variant flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-primary"  strokeWidth={2.5}/>
                    <span>MARKET VALUE (DH)</span>
                </label>
                <input 
                    type="text" 
                    data-testid="plat-price-input"
                    required
                    value={prix}
                    onChange={(e) => setPrix(e.target.value)}
                    className="w-full bg-background border-2 border-on-surface px-4 py-3 text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all placeholder:text-on-surface-variant/30"
                    placeholder="0.00"
                />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-ui-label-bold text-[10px] text-on-surface-variant flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary"  strokeWidth={2.5}/>
                <span>CULINARY CONTEXT</span>
            </label>
            <textarea 
              data-testid="plat-description-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border-2 border-on-surface px-4 py-3 text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all resize-none uppercase placeholder:text-on-surface-variant/30"
              placeholder="ALLERGENS, PAIRING NOTES, OR SPECIFIC PREPARATION DETAILS..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-ui-label-bold text-[10px] text-on-surface-variant flex items-center gap-2">
                    <Timer className="w-3.5 h-3.5 text-primary"  strokeWidth={2.5}/>
                    <span>PREP VELOCITY (MIN)</span>
                </label>
                <input 
                  type="number" 
                  data-testid="plat-time-input"
                  value={temps}
                  onChange={(e) => setTemps(parseInt(e.target.value) || 15)}
                  className="w-full bg-background border-2 border-on-surface px-4 py-3 text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-ui-label-bold text-[10px] text-on-surface-variant flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-primary"  strokeWidth={2.5}/>
                    <span>VISUAL ASSET</span>
                </label>
                <div className="relative group">
                  <input 
                    type="file" 
                    data-testid="plat-image-input"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full h-14 bg-surface-container border-2 border-dashed border-on-surface flex items-center justify-center gap-3 transition-all group-hover:bg-primary/5 group-hover:border-primary">
                    {preview ? (
                      <span className="text-ui-label-bold text-[9px] text-primary">DATA FILE LOADED</span>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 text-on-surface-variant opacity-40" />
                        <span className="text-ui-label-bold text-[9px] text-on-surface-variant opacity-60">SELECT FILE</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
          </div>

          {/* Recipe Management */}
          <div className="pt-6 border-t-2 border-on-surface/5 space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-ui-label-bold text-[11px] text-on-surface uppercase tracking-widest">Technical Recipe (Stock Link)</label>
                <button type="button" onClick={addIngredientRow} className="px-4 py-1.5 bg-background border-2 border-on-surface text-ui-label-bold text-[9px] flex items-center gap-2 hover:bg-on-surface hover:text-background transition-all">
                    <Plus className="w-3 h-3"  strokeWidth={2.5}/> ADD CONSTITUENT
                </button>
              </div>
              
              <div className="space-y-3">
                {selectedIngredients.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center animate-in slide-in-from-left-4 duration-300">
                        <div className="flex-1">
                             <select 
                                value={item.ingredient} 
                                onChange={(e) => updateIngredientRow(index, 'ingredient', parseInt(e.target.value))}
                                className="w-full bg-background border-2 border-on-surface px-4 py-2.5 text-ui-data-dense font-black focus:shadow-[3px_3px_0px_#301400] transition-all"
                            >
                                {allIngredients.map(ing => (
                                    <option key={ing.id} value={ing.id}>{ing.nom.toUpperCase()} ({ing.unite_mesure.toUpperCase()})</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-28">
                            <input 
                                type="number" 
                                step="0.01"
                                value={item.quantite} 
                                onChange={(event) => updateIngredientRow(index, 'quantite', event.target.value)}
                                placeholder="QTY"
                                className="w-full bg-background border-2 border-on-surface px-4 py-2.5 text-ui-data-dense font-black focus:shadow-[3px_3px_0px_#301400] transition-all text-center"
                            />
                        </div>
                        <button type="button" onClick={() => removeIngredientRow(index)} className="p-3 text-on-surface-variant hover:text-error transition-all active:scale-75">
                            <Minus className="w-4 h-4"  strokeWidth={2.5}/>
                        </button>
                    </div>
                ))}
              </div>
              
              {selectedIngredients.length === 0 && (
                  <div className="py-12 border-2 border-dashed border-on-surface/10 flex flex-col items-center justify-center text-on-surface-variant opacity-20 gap-3">
                      <ChefHat className="w-8 h-8"  strokeWidth={2.5}/>
                      <span className="text-ui-label-bold text-[9px] tracking-[0.2em]">NO STOCK LINKAGE DEFINED</span>
                  </div>
              )}
          </div>

          <button
            type="submit"
            data-testid="plat-save-button"
            disabled={isSaving}
            className="w-full py-4 bg-primary text-on-primary border-2 border-on-surface text-ui-button font-ui-button shadow-[4px_4px_0px_#301400] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#301400] transition-all active:translate-y-[2px] active:shadow-none mt-4"
          >
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin mx-auto"  strokeWidth={2.5}/> : (
                <div className="flex items-center justify-center gap-3 uppercase tracking-[0.2em] font-black">
                    <span>{editingPlat ? 'Commit Record Changes' : 'Confirm Creation'}</span>
                    <CheckCircle2 className="w-5 h-5"  strokeWidth={2.5}/>
                </div>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};
