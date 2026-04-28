import { useState, useEffect, FormEvent } from 'react';
import { X } from 'lucide-react';
import axiosInstance from '@shared/auth/axiosInstance';
import { Drawer } from '../../components/ui/Drawer';

interface Category {
  id: number;
  nom: string;
  description: string;
  ordre_affichage: number;
  image: string;
  est_active: boolean;
}

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Category | null;
}

export function CategoryDrawer({ isOpen, onClose, onSuccess, initialData }: CategoryDrawerProps) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [ordre, setOrdre] = useState('0');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setNom(initialData.nom);
      setDescription(initialData.description || '');
      setOrdre(initialData.ordre_affichage.toString());
      setPreviewUrl(initialData.image);
    } else {
      setNom('');
      setDescription('');
      setOrdre('0');
      setPreviewUrl(null);
    }
    setImageFile(null);
    setError('');
  }, [initialData, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nom.trim()) {
      setError('Le nom est requis.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('nom', nom);
    formData.append('description', description);
    formData.append('ordre_affichage', ordre);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (initialData) {
        await axiosInstance.patch(`/categories/${initialData.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axiosInstance.post('/categories/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Submission failed', err);
      setError(err.response?.data?.detail || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{initialData ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}</h2>
        <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nom" className="block text-sm font-medium mb-1">Nom</label>
          <input
            id="nom"
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-elevated rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Ex: Burgers"
          />
          {error && <p className="text-error text-xs mt-1">{error}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-elevated rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[100px]"
            placeholder="Description de la catégorie..."
          />
        </div>

        <div>
          <label htmlFor="ordre" className="block text-sm font-medium mb-1">Ordre d'affichage</label>
          <input
            id="ordre"
            type="number"
            value={ordre}
            onChange={(e) => setOrdre(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-elevated rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium mb-1">Image</label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-sm text-foreground-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-500/10 file:text-teal-500 hover:file:bg-teal-500/20"
          />
          {previewUrl && (
            <div className="mt-4">
              <img src={previewUrl} alt="Preview" className="w-20 h-20 rounded object-cover border border-surface-elevated" />
            </div>
          )}
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-teal-500/20"
          >
            {isSubmitting ? 'Chargement...' : initialData ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
