import React, { useState, useEffect } from 'react';
import { menuApi } from '../../api/menu';
import type { Plat, Categorie } from '../../types/menu';
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2, Clock } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export const PlatPage: React.FC = () => {
  const [plats, setPlats] = useState<Plat[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
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

  const fetchData = async () => {
    try {
      const [platsRes, catsRes] = await Promise.all([
        menuApi.getPlats(),
        menuApi.getCategories()
      ]);
      setPlats(platsRes.data);
      setCategories(catsRes.data);
      if (catsRes.data.length > 0 && !selectedCat) {
        setSelectedCat(catsRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch plats/categories', err);
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
    } else {
      setEditingPlat(null);
      setNom('');
      setDescription('');
      setPrix('');
      setTemps(15);
      if (categories.length > 0) setSelectedCat(categories[0].id);
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
    formData.append('prix', prix);
    formData.append('temps_preparation', temps.toString());
    formData.append('categorie', selectedCat.toString());
    if (image) formData.append('image', image);

    try {
      if (editingPlat) {
        await menuApi.updatePlat(editingPlat.id, formData);
      } else {
        await menuApi.createPlat(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save plat', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce plat ?')) {
      try {
        await menuApi.deletePlat(id);
        fetchData();
      } catch (err) {
        console.error('Failed to delete plat', err);
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
          <p className="text-gray-400 mt-1">Gérez les délices de votre carte.</p>
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plats.filter(p => p.est_active).map((plat) => (
            <div 
              key={plat.id}
              className="group bg-dark-surface rounded-[2rem] border border-white/10 overflow-hidden transition-all duration-300 hover:border-teal/30 hover:shadow-2xl hover:shadow-teal/5"
            >
              <div className="aspect-square relative overflow-hidden bg-[#1a323b]">
                {plat.image ? (
                  <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <ImageIcon className="w-10 h-10 opacity-20" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <button 
                    onClick={() => handleOpenModal(plat)}
                    className="p-2.5 bg-dark/80 backdrop-blur-md rounded-xl text-white hover:text-teal transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(plat.id)}
                    className="p-2.5 bg-dark/80 backdrop-blur-md rounded-xl text-white hover:text-terracotta transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 bg-teal text-white text-xs font-bold rounded-full shadow-lg">
                        {plat.prix} DH
                    </span>
                </div>
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold text-teal uppercase tracking-widest mb-1">{getCategoryName(plat.categorie)}</p>
                <h3 className="text-lg font-bold tracking-tight mb-2 line-clamp-1">{plat.nom}</h3>
                <div className="flex items-center gap-3 text-gray-400 text-xs mb-4">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{plat.temps_preparation} min</span>
                    </div>
                </div>
                <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed h-8">
                  {plat.description || 'Pas de description.'}
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
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Ingrédients, allergènes..."
            />
          </div>

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
              <div className="w-full h-24 bg-[#1a323b] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors group-hover:border-teal/50">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 text-gray-500" />
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Ajouter une photo</span>
                  </>
                )}
              </div>
            </div>
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
