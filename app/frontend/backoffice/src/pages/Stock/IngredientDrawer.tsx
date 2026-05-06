import { useState, useEffect, FormEvent } from 'react';
import { X, Scale } from 'lucide-react';
import axiosInstance from '@shared/auth/axiosInstance';
import { Drawer } from '../../components/ui/Drawer';
import { Ingredient } from './types';
import { Select } from '../../components/ui/Select';

interface IngredientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Ingredient | null;
}

export function IngredientDrawer({ isOpen, onClose, onSuccess, initialData }: IngredientDrawerProps) {
  const [nom, setNom] = useState('');
  const [unite, setUnite] = useState<'g' | 'ml' | 'pcs'>('g');
  const [seuil, setSeuil] = useState('0');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setNom(initialData.nom);
      setUnite(initialData.unite_mesure);
      setSeuil(initialData.seuil_alerte.toString());
    } else {
      setNom('');
      setUnite('g');
      setSeuil('0');
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nom.trim()) {
      setError('Le nom est requis.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      nom,
      unite_mesure: unite,
      seuil_alerte: parseFloat(seuil) || 0,
    };

    try {
      if (initialData) {
        await axiosInstance.patch(`/stock/ingredients/${initialData.id}/`, payload);
      } else {
        await axiosInstance.post('/stock/ingredients/', payload);
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
      <div className="p-6 h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{initialData ? 'Modifier l\'Ingrédient' : 'Nouvel Ingrédient'}</h2>
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
            placeholder="Ex: Tomate"
          />
          {error && <p className="text-error text-xs mt-1">{error}</p>}
        </div>

        <div>
          <label htmlFor="unite" className="block text-sm font-medium mb-1">Unité de mesure</label>
          <Select
            value={unite}
            onChange={(val) => setUnite(val as any)}
            options={[
              { value: 'g', label: 'Grammes (g)' },
              { value: 'ml', label: 'Millilitres (ml)' },
              { value: 'pcs', label: 'Pièces (pcs)' },
            ]}
            icon={<Scale size={14} />}
          />
        </div>

        <div>
          <label htmlFor="seuil" className="block text-sm font-medium mb-1">Seuil d'alerte</label>
          <input
            id="seuil"
            type="number"
            step="0.01"
            value={seuil}
            onChange={(e) => setSeuil(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-elevated rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <p className="text-[10px] text-foreground-muted mt-1">
            Une alerte sera générée si le stock tombe en dessous de ce seuil.
          </p>
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
      </div>
    </Drawer>
  );
}
