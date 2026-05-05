import { useState, useEffect } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '@shared/auth/axiosInstance';
import { Ingredient } from './types';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ingredient: Ingredient | null;
}

export function StockAdjustmentModal({ isOpen, onClose, onSuccess, ingredient }: StockAdjustmentModalProps) {
  const [adjustment, setAdjustment] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAdjustment('0');
      setError(null);
    }
  }, [isOpen]);

  if (!ingredient) return null;

  const handleAdjust = async (isAbsolute = false) => {
    setLoading(true);
    setError(null);
    try {
      const value = parseFloat(adjustment);
      if (isNaN(value)) {
        setError('Valeur invalide');
        setLoading(false);
        return;
      }

      const newStock = isAbsolute ? value : ingredient.stock_actuel + value;
      
      if (newStock < 0) {
        setError('Le stock ne peut pas être négatif');
        setLoading(false);
        return;
      }

      await axiosInstance.patch(`/stock/ingredients/${ingredient.id}/`, {
        stock_actuel: newStock,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Adjustment failed', err);
      setError('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const addValue = (val: number) => {
    const current = parseFloat(adjustment) || 0;
    // Round to 2 decimal places to avoid float issues
    const result = Math.round((current + val) * 100) / 100;
    setAdjustment(result.toString());
  };

  const shortcuts = ingredient.unite_mesure === 'pcs' 
    ? [1, 5, 10, 20] 
    : [10, 50, 100, 500];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-surface border border-surface-elevated rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Ajuster le stock</h2>
                  <p className="text-foreground-muted text-sm">{ingredient.nom} ({ingredient.unite_mesure})</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-surface-elevated rounded-lg transition-colors text-foreground-muted hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-surface-elevated/50 p-4 rounded-xl border border-surface-elevated flex justify-between items-center">
                  <span className="text-foreground-muted">Stock actuel :</span>
                  <span className="text-xl font-mono font-bold text-white">
                    {ingredient.stock_actuel} {ingredient.unite_mesure}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => addValue(-1)}
                      className="p-3 bg-surface-elevated hover:bg-surface-elevated/80 rounded-xl transition-colors text-white active:scale-95"
                    >
                      <Minus size={20} />
                    </button>
                    <input
                      type="number"
                      value={adjustment}
                      onChange={(e) => setAdjustment(e.target.value)}
                      className="flex-1 bg-surface-elevated border-none focus:ring-2 focus:ring-teal rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold text-white"
                      step={ingredient.unite_mesure === 'pcs' ? "1" : "0.01"}
                    />
                    <button
                      onClick={() => addValue(1)}
                      className="p-3 bg-surface-elevated hover:bg-surface-elevated/80 rounded-xl transition-colors text-white active:scale-95"
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {shortcuts.map((val) => (
                      <button
                        key={val}
                        onClick={() => addValue(val)}
                        className="py-2 bg-surface-elevated hover:bg-teal/20 hover:text-teal rounded-lg text-sm font-bold transition-all active:scale-95 text-foreground-muted"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {shortcuts.map((val) => (
                      <button
                        key={val}
                        onClick={() => addValue(-val)}
                        className="py-2 bg-surface-elevated hover:bg-error/20 hover:text-error rounded-lg text-sm font-bold transition-all active:scale-95 text-foreground-muted"
                      >
                        -{val}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-error text-sm font-medium text-center">{error}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleAdjust(false)}
                    disabled={loading}
                    className="flex-1 bg-teal hover:bg-teal/80 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-teal/10"
                  >
                    {loading ? '...' : 'Ajouter'}
                  </button>
                  <button
                    onClick={() => handleAdjust(true)}
                    disabled={loading}
                    className="flex-1 bg-surface-elevated hover:bg-surface-elevated/80 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all active:scale-95"
                  >
                    Définir
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
