import React, { useState, useEffect } from 'react';
import { menuApi } from '../../api/menu';
import { stockApi } from '../../api/inventory_hr';
import type { Plat, Categorie } from '../../types/menu';
import type { Ingredient, PlatIngredient } from '../../types/inventory';
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2, Clock, Minus } from 'lucide-react';
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
    return categories.find(c => c.id === id)?.nom || 'Sans catégorie';
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plats</h1>
          <p className="text-gray-400 mt-1">Gérez les délices de votre carte et leurs recettes.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal text-white rounded-xl font-medium transition-transform hover:brightness-110 active:scale-95 shadow-lg shadow-teal/20"
        >
          <Plus className="w-5 h-5" />
          Nouveau plat
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plats.filter(p => p.est_active).map((plat) => (
            <div 
              key={plat.id}
              className="group bg-dark-surface/50 rounded-[2.5rem] border border-white/5 overflow-hidden transition-all duration-500 hover:bg-dark-surface hover:border-teal/30 hover:shadow-2xl hover:shadow-teal/5"
            >
              <div className="aspect-[4/3] relative overflow-hidden">
                {plat.image ? (
                  <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1a323b] text-gray-500">
                    <ImageIcon className="w-12 h-12 opacity-10" />
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => handleOpenModal(plat)}
                    className="p-3 bg-dark-surface/60 backdrop-blur-xl rounded-2xl text-white hover:text-teal hover:bg-dark-surface transition-all duration-200 shadow-xl border border-white/5"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(plat.id)}
                    className="p-3 bg-dark-surface/60 backdrop-blur-xl rounded-2xl text-white hover:text-terracotta hover:bg-dark-surface transition-all duration-200 shadow-xl border border-white/5"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Price Badge */}
                <div className="absolute bottom-4 left-4">
                  <div className="px-4 py-2 bg-teal/90 backdrop-blur-md text-white text-sm font-extrabold rounded-2xl shadow-xl">
                    {plat.prix} DH
                  </div>
                </div>
              </div>

              <div className="p-7">
                <p className="text-[11px] font-black text-teal uppercase tracking-[0.2em] mb-3 opacity-80">
                  {getCategoryName(plat.categorie)}
                </p>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight group-hover:text-teal transition-colors">
                  {plat.nom}
                </h3>
                
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-5 font-medium">
                  <Clock className="w-4 h-4 text-teal" />
                  <span>{plat.temps_preparation} min</span>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 h-10 italic">
                  {plat.description || 'Une création culinaire d\'exception signée Tastify.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingPlat ? 'Modifier le plat' : 'Nouveau plat'}
      >
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 col-span-2">
                <label className="text-sm font-medium text-gray-400">Nom du plat</label>
                <input 
                type="text" 
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full bg-[#1a323b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal transition-colors"
                placeholder="Ex: Couscous Royal..."
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Catégorie</label>
                <select 
                value={selectedCat}
                onChange={(e) => setSelectedCat(parseInt(e.target.value))}
                className="w-full bg-[#1a323b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal transition-colors"
                >
                {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
                </select>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Prix (DH)</label>
                <input 
                type="text" 
                required
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                className="w-full bg-[#1a323b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal transition-colors"
                placeholder="0.00"
                />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-400">Description</label>
            <textarea 
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#1a323b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal transition-colors resize-none"
              placeholder="Allergènes, détails..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Temps de préparation (min)</label>
                <input 
                  type="number" 
                  value={temps}
                  onChange={(e) => setTemps(parseInt(e.target.value) || 15)}
                  className="w-full bg-[#1a323b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Image</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full h-12 bg-[#1a323b] border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 transition-colors group-hover:border-teal/50">
                    {preview ? (
                      <span className="text-xs text-teal font-bold">Image sélectionnée</span>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500 font-bold">Ajouter</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Ingrédients (Recette)</label>
                <button type="button" onClick={addIngredientRow} className="text-xs text-teal font-bold flex items-center gap-1 hover:brightness-110">
                    <Plus className="w-3 h-3" /> Ajouter un ingrédient
                </button>
              </div>
              
              {selectedIngredients.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                      <select 
                          value={item.ingredient} 
                          onChange={(e) => updateIngredientRow(index, 'ingredient', parseInt(e.target.value))}
                          className="flex-1 bg-[#1a323b] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-teal"
                      >
                          {allIngredients.map(ing => (
                              <option key={ing.id} value={ing.id}>{ing.nom} ({ing.unite_mesure})</option>
                          ))}
                      </select>
                      <input 
                          type="number" 
                          step="0.01"
                          value={item.quantite} 
                          onChange={(e) => updateIngredientRow(index, 'quantite', e.target.value)}
                          placeholder="Qté"
                          className="w-24 bg-[#1a323b] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-teal"
                      />
                      <button type="button" onClick={() => removeIngredientRow(index)} className="p-2 text-gray-500 hover:text-terracotta">
                          <Minus className="w-4 h-4" />
                      </button>
                  </div>
              ))}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 mt-2 bg-teal text-white rounded-xl font-bold transition-transform hover:brightness-110 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingPlat ? 'Mettre à jour' : 'Ajouter à la carte')}
          </button>
        </form>
      </Modal>
    </div>
  );
};
