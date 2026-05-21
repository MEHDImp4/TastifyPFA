import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api/axios';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Loader2, 
  CreditCard,
  ChevronLeft,
  ShieldCheck,
  UtensilsCrossed
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { items, updateQty, removeItem, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipPercent, setTipPercent] = useState<number>(0);
  const navigate = useNavigate();

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.plat.prix) * item.quantite), 0);
  const serviceTax = subtotal * 0.08;
  const tipAmount = subtotal * (tipPercent / 100);
  const grandTotal = subtotal + serviceTax + tipAmount;

  const handleOrder = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/commandes/', {
        type: 'EMPORTER',
        lignes: items.map(i => ({
          plat: i.plat.id,
          quantite: i.quantite,
          notes: ''
        }))
      });
      setIsSuccess(true);
      clearCart();
    } catch (err: any) {
      setError("Erreur lors de la commande. Veuillez vérifier votre connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-1000 bg-background min-h-[80vh]">
        <div className="relative inline-flex items-center justify-center mb-12">
            <div className="absolute inset-0 bg-primary opacity-10 blur-[100px] rounded-full scale-150 animate-pulse" />
            <div className="relative w-40 h-40 rounded-[3rem] bg-background border-2 border-primary/20 flex items-center justify-center text-primary cinematic-shadow">
                <ShieldCheck className="w-20 h-20" strokeWidth={1} />
            </div>
        </div>
        <h2 className="text-display-lg text-5xl md:text-8xl text-on-surface leading-none mb-6 italic">Manifest <br /><span className="font-light">Secured.</span></h2>
        <p className="text-2xl font-body text-on-surface-variant leading-relaxed max-w-xl mb-12 opacity-60 italic">Your culinary manifest has been received. Our master chefs are beginning the orchestration.</p>
        <div className="flex flex-col sm:flex-row gap-6">
            <button onClick={() => navigate('/account')} className="px-16 py-6 bg-on-surface text-background text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:bg-primary cinematic-shadow active:scale-95 rounded-2xl">Track Progress</button>
            <button onClick={() => navigate('/')} className="px-16 py-6 bg-surface-container text-on-surface text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:bg-surface-container-highest active:scale-95 rounded-2xl border border-on-surface/5">Return Home</button>
        </div>
    </div>
  );

  if (items.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center py-48 gap-12 bg-background">
        <div className="relative">
            <div className="absolute inset-0 bg-on-surface opacity-5 blur-[60px] rounded-full scale-150" />
            <div className="relative w-32 h-32 rounded-[2.5rem] bg-surface-container-high border-2 border-dashed border-on-surface/10 flex items-center justify-center text-on-surface-variant/40">
                <ShoppingBag className="w-12 h-12" strokeWidth={1} />
            </div>
        </div>
        <div className="space-y-6">
            <h2 className="text-display-lg text-4xl lg:text-6xl text-on-surface leading-tight">Your palette <br /><span className="italic font-light opacity-60">is waiting.</span></h2>
            <p className="text-xl font-body text-on-surface-variant opacity-40 italic">Add signature creations from our catalog to begin your journey.</p>
        </div>
        <button 
          onClick={() => navigate('/menu')} 
          className="px-16 py-6 bg-on-surface text-background text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:bg-primary cinematic-shadow active:scale-95 rounded-2xl"
        >
          Explore Catalog
        </button>
    </div>
  );

  return (
    <div className="flex-1 bg-background selection:bg-primary/10 selection:text-primary">
      <main className="max-w-[1400px] mx-auto px-8 py-16 lg:py-32">
        
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20">
            <div className="flex items-center gap-8">
                <button onClick={() => navigate('/menu')} className="w-16 h-16 bg-surface-container rounded-full hover:bg-surface-container-high transition-all active:scale-90 border border-on-surface/5 flex items-center justify-center">
                    <ChevronLeft className="w-6 h-6 text-on-surface" strokeWidth={2} />
                </button>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="h-[1px] w-8 bg-primary"></span>
                        <span className="editorial-kicker">Operational Manifest</span>
                    </div>
                    <h1 className="text-display-lg text-4xl md:text-6xl text-on-surface leading-none">Review Your <br /><span className="italic font-light">Selection.</span></h1>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
            
            {/* Left: Summary & Tipping */}
            <div className="lg:col-span-7 space-y-20">
                <div className="space-y-8">
                    <AnimatePresence mode="popLayout">
                        {items.map(item => (
                            <motion.div 
                                key={item.plat.id} 
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="p-8 editorial-card flex items-center gap-10 transition-all hover:bg-surface-container-low cinematic-shadow group"
                            >
                                <div className="w-32 h-32 rounded-3xl overflow-hidden bg-surface-container-high shrink-0 relative">
                                    {item.plat.image ? (
                                        <img src={item.plat.image} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" alt={item.plat.nom} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-on-surface/5 font-serif italic text-4xl">
                                            {item.plat.nom.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-secondary tracking-widest uppercase">Registry Segment</span>
                                        <UtensilsCrossed className="w-3 h-3 text-on-surface-variant/20" />
                                    </div>
                                    <h3 className="text-3xl font-serif italic text-on-surface truncate tracking-tight mb-2">{item.plat.nom}</h3>
                                    <p className="text-ui-label-bold text-[10px] text-primary tracking-[0.2em]">{item.plat.prix} DH / UNIT</p>
                                </div>
                                <div className="flex flex-col items-end gap-6">
                                    <div className="flex items-center bg-background border border-on-surface/5 rounded-full p-2 shadow-inner">
                                        <button onClick={() => updateQty(item.plat.id, -1)} className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-75"><Minus className="w-5 h-5" strokeWidth={2.5} /></button>
                                        <span className="text-ui-data-dense font-black text-lg w-12 text-center text-on-surface">{item.quantite}</span>
                                        <button onClick={() => updateQty(item.plat.id, 1)} className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-75"><Plus className="w-5 h-5" strokeWidth={2.5} /></button>
                                    </div>
                                    <button onClick={() => removeItem(item.plat.id)} className="text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant/30 hover:text-error transition-colors flex items-center gap-2">
                                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                                        Remove Selection
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Tipping Section */}
                <div className="space-y-10 border-t border-on-surface/5 pt-20">
                    <div className="space-y-4">
                        <span className="editorial-kicker">Gratuity calibration</span>
                        <h2 className="text-3xl font-serif italic text-on-surface">Recognize Orchestration</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[10, 15, 20, 25].map(p => (
                            <button 
                                key={p}
                                onClick={() => setTipPercent(p)}
                                className={`
                                    py-6 px-4 rounded-3xl border-2 transition-all duration-500 font-black text-[12px] tracking-[0.2em]
                                    ${tipPercent === p ? 'bg-on-surface border-on-surface text-background cinematic-shadow scale-105' : 'bg-surface-container border-transparent text-on-surface-variant/60 hover:border-primary/20'}
                                `}
                            >
                                {p}% REWARD
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Totals & Action */}
            <aside className="lg:col-span-5 space-y-12 lg:sticky lg:top-32">
                <div className="p-12 bg-on-surface text-background rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary opacity-20 blur-[120px] -mr-48 -mt-48 transition-transform duration-[2000ms] group-hover:scale-110" />
                    
                    <div className="flex items-center justify-between mb-16 relative z-10">
                        <div className="flex items-center gap-4">
                            <CreditCard className="w-6 h-6 text-primary" strokeWidth={1.5} />
                            <h3 className="text-ui-label-bold text-[11px] tracking-[0.4em]">BILLING PROTOCOL</h3>
                        </div>
                    </div>

                    <div className="space-y-8 mb-20 relative z-10">
                        <div className="flex justify-between items-center text-background/40 text-[10px] font-black uppercase tracking-[0.3em]">
                            <span>Catalog Value</span>
                            <span className="text-background">{subtotal.toFixed(2)} DH</span>
                        </div>
                        <div className="flex justify-between items-center text-background/40 text-[10px] font-black uppercase tracking-[0.3em]">
                            <span>Service Tax (8%)</span>
                            <span className="text-background">{serviceTax.toFixed(2)} DH</span>
                        </div>
                        {tipPercent > 0 && (
                            <div className="flex justify-between items-center text-background/40 text-[10px] font-black uppercase tracking-[0.3em]">
                                <span>Calibrated Gratuity</span>
                                <span className="text-primary">{tipAmount.toFixed(2)} DH</span>
                            </div>
                        )}
                        <div className="pt-12 border-t border-white/5 flex justify-between items-end">
                            <div className="flex flex-col gap-2">
                                <span className="text-ui-label-bold text-[8px] text-background/20 tracking-[0.4em]">SETTLEMENT TOTAL</span>
                                <span className="text-2xl text-background/60 font-body italic">Payable</span>
                            </div>
                            <div className="text-right">
                                <motion.span 
                                    key={grandTotal}
                                    initial={{ scale: 1.1, color: '#8d4e1c' }}
                                    animate={{ scale: 1, color: '#ffceaf' }}
                                    className="text-display-lg text-5xl md:text-7xl leading-none inline-block"
                                >
                                    {grandTotal.toFixed(2)}
                                </motion.span>
                                <span className="text-ui-label-bold text-lg ml-4 text-background/20 font-sans font-black">DH</span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-10 p-6 bg-error text-on-error border-2 border-on-surface text-[10px] font-black tracking-[0.2em] text-center uppercase cinematic-shadow animate-in shake duration-500">
                            SYSTEM ERROR: {error}
                        </div>
                    )}

                    <button 
                        onClick={handleOrder}
                        disabled={isSubmitting}
                        className="w-full py-8 bg-primary text-on-primary text-[13px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-6 transition-all hover:scale-[1.02] cinematic-shadow active:scale-95 disabled:opacity-50 relative z-10 rounded-2xl"
                    >
                        {isSubmitting ? <Loader2 className="w-7 h-7 animate-spin" strokeWidth={2.5} /> : (
                            <>
                                <span>Authorize Manifest</span>
                                <ArrowRight className="w-5 h-5 text-background" strokeWidth={2.5} />
                            </>
                        )}
                    </button>
                    <p className="mt-8 text-center text-[8px] font-black text-background/20 uppercase tracking-[0.4em]">Secure Encrypted Session</p>
                </div>
                
                <div className="px-12 text-center space-y-6">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] opacity-40 leading-relaxed italic">
                        By committing this manifest, you authorize the immediate orchestration of your selection. Final settlement occurs via premium digital channel at retrieval point.
                    </p>
                </div>
            </aside>
        </div>
      </main>
    </div>
  );
};
