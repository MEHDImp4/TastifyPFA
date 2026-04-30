import { useState, useEffect, FormEvent } from 'react';
import { X } from 'lucide-react';
import axiosInstance from '@shared/auth/axiosInstance';
import { normalizeMediaUrl } from '@shared/media/mediaUrl';
import { Drawer } from '../../components/ui/Drawer';
import { Category, Plat } from './types';
import { Switch } from '../../components/ui/Switch';

interface PlatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Plat | null;
  categories: Category[];
  defaultCategoryId?: number | 'all';
}

export function PlatDrawer({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialData, 
  categories,
  defaultCategoryId
}: PlatDrawerProps) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [categorieId, setCategorieId] = useState<string>('');
  const [prix, setPrix] = useState('');
  const [tempsPreparation, setTempsPreparation] = useState('15');
  const [estDisponible, setEstDisponible] = useState(true);
  const [estActive, setEstActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setNom(initialData.nom);
      setDescription(initialData.description || '');
      setCategorieId(initialData.categorie.toString());
      setPrix(initialData.prix.toString());
      setTempsPreparation(initialData.temps_preparation.toString());
      setEstDisponible(initialData.est_disponible);
      setEstActive(initialData.est_active);
      setPreviewUrl(normalizeMediaUrl(initialData.image) ?? null);
    } else {
      setNom('');
      setDescription('');
      setCategorieId(defaultCategoryId && defaultCategoryId !== 'all' ? defaultCategoryId.toString() : '');
      setPrix('');
      setTempsPreparation('15');
      setEstDisponible(true);
      setEstActive(true);
      setPreviewUrl(null);
    }
    setImageFile(null);
    setErrors({});
  }, [initialData, isOpen, defaultCategoryId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nom.trim()) newErrors.nom = 'Le nom est requis.';
    if (!categorieId) newErrors.categorie = 'La catégorie est requise.';
    if (!prix || isNaN(Number(prix)) || Number(prix) < 0) {
      newErrors.prix = 'Prix invalide.';
    }
    if (!tempsPreparation || isNaN(Number(tempsPreparation)) || Number(tempsPreparation) < 0) {
      newErrors.temps_preparation = 'Temps invalide.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('nom', nom);
    formData.append('description', description);
    formData.append('categorie', categorieId);
    formData.append('prix', prix);
    formData.append('temps_preparation', tempsPreparation);
    formData.append('est_disponible', String(estDisponible));
    formData.append('est_active', String(estActive));
    
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (initialData) {
        await axiosInstance.patch(`/plats/${initialData.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axiosInstance.post('/plats/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Submission failed', err);
      setErrors({ server: err.response?.data?.detail || 'Une erreur est survenue.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">
          {initialData ? 'Modifier le Plat' : 'Nouveau Plat'}
        </h2>
        <button onClick={onClose} className="text-foreground-muted hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        {/* Section: Infos de base */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-teal-500 uppercase tracking-widest">Informations de base</h3>
          
          <div>
            <label htmlFor="nom" className="block text-sm font-medium mb-1 text-foreground-muted">Nom</label>
            <input
              id="nom"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full bg-surface-elevated border border-white/5 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Ex: Burger Gourmet"
            />
            {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom}</p>}
          </div>

          <div>
            <label htmlFor="categorie" className="block text-sm font-medium mb-1 text-foreground-muted">Catégorie</label>
            <select
              id="categorie"
              value={categorieId}
              onChange={(e) => setCategorieId(e.target.value)}
              className="w-full bg-surface-elevated border border-white/5 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nom}</option>
              ))}
            </select>
            {errors.categorie && <p className="text-red-400 text-xs mt-1">{errors.categorie}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1 text-foreground-muted">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-elevated border border-white/5 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[80px] resize-none"
              placeholder="Description du plat..."
            />
          </div>
        </div>

        {/* Section: Prix & Opérations */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-xs font-bold text-teal-500 uppercase tracking-widest">Prix & Opérations</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prix" className="block text-sm font-medium mb-1 text-foreground-muted">Prix (€)</label>
              <input
                id="prix"
                type="number"
                step="0.01"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                className="w-full bg-surface-elevated border border-white/5 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {errors.prix && <p className="text-red-400 text-xs mt-1">{errors.prix}</p>}
            </div>
            <div>
              <label htmlFor="temps" className="block text-sm font-medium mb-1 text-foreground-muted">Préparation (min)</label>
              <input
                id="temps"
                type="number"
                value={tempsPreparation}
                onChange={(e) => setTempsPreparation(e.target.value)}
                className="w-full bg-surface-elevated border border-white/5 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {errors.temps_preparation && <p className="text-red-400 text-xs mt-1">{errors.temps_preparation}</p>}
            </div>
          </div>
        </div>

        {/* Section: Média & Statut */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-xs font-bold text-teal-500 uppercase tracking-widest">Média & Statut</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground-muted">Image</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-surface-elevated border border-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-foreground-muted uppercase">No image</span>
                )}
              </div>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-xs text-foreground-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-500/10 file:text-teal-500 hover:file:bg-teal-500/20"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Switch 
              label="Disponible immédiatement" 
              checked={estDisponible} 
              onToggle={() => setEstDisponible(!estDisponible)} 
              disabled={!estActive}
            />
            <Switch 
              label="Activé (Visible par les clients)" 
              checked={estActive} 
              onToggle={() => setEstActive(!estActive)} 
            />
          </div>
        </div>

        {errors.server && (
          <p className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">
            {errors.server}
          </p>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98]"
          >
            {isSubmitting ? 'Traitement...' : initialData ? 'Enregistrer les modifications' : 'Créer le plat'}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
