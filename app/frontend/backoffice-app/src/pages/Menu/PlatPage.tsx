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
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-700 bg-background">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface font-sans">Culinary Catalog</h1>
          <p className="text-on-surface-variant mt-1.5 font-sans font-medium">Manage your restaurant's signature dishes and technical recipes.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-3 px-6 py-3.5 bg-primary text-white rounded-xl font-bold transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/20 active:scale-95 shadow-lg shadow-primary/10"
        >
          <Plus className="w-5 h-5" />
          <span>New Culinary Creation</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
          {plats.filter(p => p.est_active).map((plat) => (
            <div 
              key={plat.id}
              className="group double-bezel bg-white p-3 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5 cursor-default"
            >
              <div className="aspect-[4/3] relative rounded-xl overflow-hidden bg-surface-container-low mb-5">
                {plat.image ? (
                  <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant opacity-20 font-display-accent italic text-6xl">
                    {plat.nom.charAt(0)}
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <button 
                    onClick={() => handleOpenModal(plat)}
                    className="p-3 bg-white/80 backdrop-blur-xl rounded-xl text-on-surface hover:text-primary shadow-lg transition-all active:scale-90"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(plat.id)}
                    className="p-3 bg-white/80 backdrop-blur-xl rounded-xl text-on-surface hover:text-error shadow-lg transition-all active:scale-90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Price Badge */}
                <div className="absolute bottom-4 left-4">
                  <div className="glass px-4 py-2 text-on-surface text-sm font-bold rounded-xl shadow-lg border border-primary/10">
                    {plat.prix} DH
                  </div>
                </div>
              </div>

              <div className="px-3 pb-3">
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3 opacity-80">
                  {getCategoryName(plat.categorie)}
                </p>
                <h3 className="text-2xl font-bold text-on-surface mb-3 tracking-tight font-sans group-hover:text-primary transition-colors">
                  {plat.nom}
                </h3>
                
                <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-bold uppercase tracking-widest mb-5 opacity-60 font-sans">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{plat.temps_preparation} MIN PREP</span>
                </div>

                <p className="text-on-surface-variant text-sm font-medium leading-relaxed line-clamp-2 h-10 opacity-70 font-sans italic">
                  {plat.description || 'An exceptional culinary creation signed by Tastify.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingPlat ? 'Refine Creation' : 'Define Creation'}
      >
        <form onSubmit={handleSubmit} className="space-y-8 p-2 max-h-[75vh] overflow-y-auto pr-4 scrollbar-hide">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex flex-col gap-3 sm:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Tag className="w-3 h-3 text-primary" />
                    <span>Dish Identification</span>
                </label>
                <input 
                    type="text" 
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-5 py-4 text-on-surface font-bold focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-sans"
                    placeholder="Ex: Moroccan Spiced Salmon..."
                />
            </div>

            <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <ChefHat className="w-3 h-3 text-primary" />
                    <span>Sector Allocation</span>
                </label>
                <select 
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(parseInt(e.target.value))}
                    className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-5 py-4 text-on-surface font-bold focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-sans appearance-none"
                >
                {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
                </select>
            </div>

            <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <DollarSign className="w-3 h-3 text-primary" />
                    <span>Market Value (DH)</span>
                </label>
                <input 
                    type="text" 
                    required
                    value={prix}
                    onChange={(e) => setPrix(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-5 py-4 text-on-surface font-bold focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-sans"
                    placeholder="0.00"
                />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <ImageIcon className="w-3 h-3 text-primary" />
                <span>Culinary Context</span>
            </label>
            <textarea 
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-5 py-4 text-on-surface font-semibold focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none font-sans"
              placeholder="Allergens, pairing notes, or specific preparation details..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Timer className="w-3 h-3 text-primary" />
                    <span>Prep Velocity (Min)</span>
                </label>
                <input 
                  type="number" 
                  value={temps}
                  onChange={(e) => setTemps(parseInt(e.target.value) || 15)}
                  className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-5 py-4 text-on-surface font-bold focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-sans"
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <ImageIcon className="w-3 h-3 text-primary" />
                    <span>Visual Identity</span>
                </label>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full h-[60px] bg-surface-container-low border-2 border-dashed border-surface-container-high rounded-xl flex items-center justify-center gap-3 transition-all group-hover:border-primary/40 group-hover:bg-primary-container/5">
                    {preview ? (
                      <span className="text-xs text-primary font-bold uppercase tracking-widest">Asset Selected</span>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 text-on-surface-variant opacity-40" />
                        <span className="text-[10px] font-bold text-on-surface-variant opacity-60 uppercase tracking-widest">Upload Asset</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
          </div>

          {/* Recipe Management */}
          <div className="pt-8 border-t border-surface-container-high space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-on-surface uppercase tracking-[0.2em] ml-1">Technical Recipe (Stock Link)</label>
                <button type="button" onClick={addIngredientRow} className="px-3 py-1.5 bg-primary-container/20 text-primary rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-primary hover:text-white transition-all">
                    <Plus className="w-3 h-3" /> Add Constituent
                </button>
              </div>
              
              <div className="space-y-4">
                {selectedIngredients.map((item, index) => (
                    <div key={index} className="flex gap-4 items-center animate-in slide-in-from-left-4 duration-300">
                        <div className="flex-1 relative">
                             <select 
                                value={item.ingredient} 
                                onChange={(e) => updateIngredientRow(index, 'ingredient', parseInt(e.target.value))}
                                className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-4 py-3 text-on-surface font-bold text-sm focus:outline-none focus:border-primary transition-all appearance-none"
                            >
                                {allIngredients.map(ing => (
                                    <option key={ing.id} value={ing.id}>{ing.nom} ({ing.unite_mesure})</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-32 relative">
                            <input 
                                type="number" 
                                step="0.01"
                                value={item.quantite} 
                                onChange={(e) => updateIngredientRow(index, 'quantite', e.target.value)}
                                placeholder="Qty"
                                className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-4 py-3 text-on-surface font-bold text-sm focus:outline-none focus:border-primary transition-all text-center"
                            />
                        </div>
                        <button type="button" onClick={() => removeIngredientRow(index)} className="p-3 text-on-surface-variant opacity-40 hover:text-error hover:bg-error-container/30 rounded-xl transition-all active:scale-75">
                            <Minus className="w-4 h-4" />
                        </button>
                    </div>
                ))}
              </div>
              
              {selectedIngredients.length === 0 && (
                  <div className="py-10 border-2 border-dashed border-surface-container-high rounded-2xl flex flex-col items-center justify-center text-on-surface-variant opacity-30 gap-2">
                      <ChefHat className="w-8 h-8" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">No stock linkage defined</span>
                  </div>
              )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-5 mt-4 bg-primary text-white rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                    <span>{editingPlat ? 'Update Culinary Record' : 'Confirm Dish Creation'}</span>
                    <CheckCircle2 className="w-6 h-6" />
                </>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};
