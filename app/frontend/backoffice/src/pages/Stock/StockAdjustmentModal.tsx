import { useState, useEffect, useRef } from 'react';
import { X, Minus, Plus, ArrowRight, AlertCircle, CheckCircle2, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '@shared/auth/axiosInstance';
import { Ingredient } from './types';
import { Select } from '../../components/ui/Select';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ingredient: Ingredient | null;
}

type AdjustmentMode = 'relative' | 'absolute';

export function StockAdjustmentModal({ isOpen, onClose, onSuccess, ingredient }: StockAdjustmentModalProps) {
  const [mode, setMode] = useState<AdjustmentMode>('relative');
  const [value, setValue] = useState<string>('0');
  const [reason, setReason] = useState<string>('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMode('relative');
      setValue('0');
      setReason('manual');
      setError(null);
      setShowSuccess(false);
      // Auto-focus after animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!ingredient) return null;

  const currentStock = parseFloat(String(ingredient.stock_actuel)) || 0;
  const numericValue = parseFloat(value) || 0;
  const resultStock = mode === 'relative' 
    ? Math.round((currentStock + numericValue) * 100) / 100
    : numericValue;

  const isValid = !isNaN(numericValue) && resultStock >= 0;

  const handleAdjust = async () => {
    if (!isValid) {
      setError(resultStock < 0 ? 'Le stock ne peut pas être négatif' : 'Valeur invalide');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await axiosInstance.patch(`/stock/ingredients/${ingredient.id}/`, {
        stock_actuel: resultStock,
        // The backend doesn't save the reason yet, but we're preparing the UI
      });
      
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    } catch (err) {
      console.error('Adjustment failed', err);
      setError('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const addValue = (val: number) => {
    const current = parseFloat(value) || 0;
    const result = Math.round((current + val) * 100) / 100;
    setValue(result.toString());
    inputRef.current?.focus();
  };

  const shortcuts = ingredient.unite_mesure === 'pcs' 
    ? [1, 5, 10, 50] 
    : [10, 100, 500, 1000];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-surface border border-surface-elevated rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Success Overlay */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="absolute inset-0 z-10 bg-teal flex flex-col items-center justify-center text-white p-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                  >
                    <CheckCircle2 size={64} className="mb-4" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-1 text-white">Stock Mis à Jour</h3>
                  <p className="opacity-90">{ingredient.nom} : {resultStock} {ingredient.unite_mesure}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Ajuster le stock</h2>
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
                {/* Mode Selector */}
                <div className="flex bg-surface-elevated/50 p-1 rounded-xl border border-surface-elevated">
                  <button
                    onClick={() => setMode('relative')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      mode === 'relative' ? 'bg-surface shadow-lg text-teal' : 'text-foreground-muted hover:text-white'
                    }`}
                  >
                    Variation (+/-)
                  </button>
                  <button
                    onClick={() => setMode('absolute')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      mode === 'absolute' ? 'bg-surface shadow-lg text-amber' : 'text-foreground-muted hover:text-white'
                    }`}
                  >
                    Nouvel état
                  </button>
                </div>

                {/* Input Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => addValue(-1)}
                      className="p-4 bg-surface-elevated hover:bg-surface-elevated/80 rounded-2xl transition-all text-white active:scale-90 border border-white/5"
                    >
                      <Minus size={24} />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="number"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdjust()}
                        className={`w-full bg-surface-elevated border-2 transition-colors focus:ring-0 rounded-2xl px-4 py-4 text-center text-3xl font-mono font-bold text-white ${
                          error ? 'border-terracotta' : 'border-transparent focus:border-teal/50'
                        }`}
                        step={ingredient.unite_mesure === 'pcs' ? "1" : "0.01"}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground-muted uppercase tracking-widest">
                        {ingredient.unite_mesure}
                      </span>
                    </div>
                    <button
                      onClick={() => addValue(1)}
                      className="p-4 bg-surface-elevated hover:bg-surface-elevated/80 rounded-2xl transition-all text-white active:scale-90 border border-white/5"
                    >
                      <Plus size={24} />
                    </button>
                  </div>

                  {/* Shortcuts */}
                  <div className="grid grid-cols-4 gap-2">
                    {shortcuts.map((val) => (
                      <button
                        key={val}
                        onClick={() => addValue(val)}
                        className="py-2.5 bg-surface-elevated hover:bg-white/10 rounded-xl text-xs font-black transition-all active:scale-95 text-foreground-muted hover:text-white border border-white/5"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview */}
                <div className="bg-surface-elevated/30 p-4 rounded-2xl border border-surface-elevated flex items-center justify-between group overflow-hidden relative">
                  <div className="text-center flex-1">
                    <p className="text-[10px] uppercase font-bold text-foreground-muted tracking-widest mb-1">Actuel</p>
                    <p className="text-lg font-mono font-bold text-white/60">{currentStock}</p>
                  </div>
                  <div className="px-4 text-foreground-muted animate-pulse">
                    <ArrowRight size={20} />
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-[10px] uppercase font-bold text-foreground-muted tracking-widest mb-1">Final</p>
                    <p className={`text-xl font-mono font-black ${resultStock < 0 ? 'text-terracotta' : 'text-white'}`}>
                      {resultStock}
                    </p>
                  </div>
                  {/* Progress bar visual */}
                  <div className="absolute bottom-0 left-0 h-1 bg-teal/20 w-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-teal" 
                      initial={{ width: '0%' }}
                      animate={{ width: `${Math.min(100, (resultStock / (currentStock || 1)) * 50)}%` }}
                    />
                  </div>
                </div>

                {/* Reason Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-foreground-muted tracking-widest ml-1">Motif de l'ajustement</label>
                  <Select
                    value={reason}
                    onChange={setReason}
                    options={[
                      { value: "manual", label: "Inventaire manuel" },
                      { value: "delivery", label: "Réception de commande (Livraison)" },
                      { value: "waste", label: "Perte / Gaspillage / Casse" },
                      { value: "correction", label: "Correction d'erreur" },
                      { value: "gift", label: "Offert / Dégustation" },
                    ]}
                    icon={<ClipboardList size={14} />}
                  />
                </div>

                {/* Feedback */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-2 text-terracotta bg-terracotta/10 p-3 rounded-xl border border-terracotta/20"
                    >
                      <AlertCircle size={18} className="shrink-0" />
                      <p className="text-xs font-bold">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action */}
                <button
                  onClick={handleAdjust}
                  disabled={loading || !isValid}
                  className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-xl active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-2 ${
                    mode === 'relative' ? 'bg-teal shadow-teal/20' : 'bg-amber shadow-amber/20'
                  }`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'relative' ? (numericValue >= 0 ? 'Ajouter au stock' : 'Retirer du stock') : 'Définir le stock'}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

