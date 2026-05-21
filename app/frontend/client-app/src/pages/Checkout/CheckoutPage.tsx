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
  ShieldCheck
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { items, updateQty, removeItem, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [, setError] = useState<string | null>(null);
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
    <div className="flex-1 bg-background selection:bg-primary/10 selection:text-primary h-[calc(100vh-4rem)] overflow-hidden">
      <main className="h-full max-w-[1400px] mx-auto px-6 py-6 flex flex-col overflow-hidden">
        
        {/* Editorial Header */}
        <div className="flex items-center gap-6 mb-6 shrink-0">
            <button onClick={() => navigate('/menu')} className="w-12 h-12 bg-surface-container rounded-full hover:bg-surface-container-high transition-all active:scale-90 border border-on-surface/5 flex items-center justify-center">
                <ChevronLeft className="w-5 h-5 text-on-surface" strokeWidth={2} />
            </button>
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <span className="h-[1px] w-6 bg-primary"></span>
                    <span className="editorial-kicker text-[8px]">Manifest</span>
                </div>
                <h1 className="text-display-lg text-3xl lg:text-4xl text-on-surface leading-none italic">Review Your Selection.</h1>
            </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start overflow-hidden">
            
            {/* Left: Summary & Tipping (Scrollable) */}
            <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-4">
                    <AnimatePresence mode="popLayout">
                        {items.map(item => (
                            <motion.div 
                                key={item.plat.id} 
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="p-4 bg-surface-container-low border border-on-surface/5 rounded-2xl flex items-center gap-6 group"
                            >
                                <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container-high shrink-0">
                                    {item.plat.image ? (
                                        <img src={item.plat.image} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700" alt={item.plat.nom} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-on-surface/5 font-serif italic text-2xl">
                                            {item.plat.nom.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-serif italic text-on-surface truncate tracking-tight">{item.plat.nom}</h3>
                                    <p className="text-[10px] text-primary font-black uppercase tracking-wider">{item.plat.prix} DH</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center bg-background border border-on-surface/5 rounded-full p-1">
                                        <button onClick={() => updateQty(item.plat.id, -1)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary active:scale-75"><Minus className="w-4 h-4" /></button>
                                        <span className="text-xs font-black w-8 text-center">{item.quantite}</span>
                                        <button onClick={() => updateQty(item.plat.id, 1)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary active:scale-75"><Plus className="w-4 h-4" /></button>
                                    </div>
                                    <button onClick={() => removeItem(item.plat.id)} className="p-2 text-on-surface-variant/20 hover:text-error transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Tipping Section (Compact) */}
                <div className="mt-4 pt-4 border-t border-on-surface/5 shrink-0">
                    <span className="editorial-kicker text-[8px] opacity-40 mb-3 block uppercase">Recognize Orchestration</span>
                    <div className="grid grid-cols-4 gap-3">
                        {[10, 15, 20, 25].map(p => (
                            <button 
                                key={p}
                                onClick={() => setTipPercent(p)}
                                className={`
                                    py-3 rounded-xl border-2 transition-all font-black text-[10px] tracking-widest
                                    ${tipPercent === p ? 'bg-on-surface border-on-surface text-background' : 'bg-surface-container border-transparent text-on-surface-variant/60 hover:border-primary/20'}
                                `}
                            >
                                {p}%
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Totals & Action */}
            <aside className="lg:col-span-5 h-full flex flex-col">
                <div className="flex-1 p-8 bg-on-surface text-background rounded-[2rem] shadow-2xl relative overflow-hidden group flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-10 blur-[80px] -mr-32 -mt-32" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-10">
                            <CreditCard className="w-5 h-5 text-primary" strokeWidth={1.5} />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Settlement</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40">
                                <span>Subtotal</span>
                                <span>{subtotal.toFixed(2)} DH</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40">
                                <span>Tax (8%)</span>
                                <span>{serviceTax.toFixed(2)} DH</span>
                            </div>
                            {tipPercent > 0 && (
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-primary">
                                    <span>Reward</span>
                                    <span>{tipAmount.toFixed(2)} DH</span>
                                </div>
                            )}
                            <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                                <span className="text-xl italic font-light text-background/60">Total</span>
                                <div className="text-right">
                                    <motion.span 
                                        key={grandTotal}
                                        initial={{ scale: 1.05 }}
                                        animate={{ scale: 1 }}
                                        className="text-display-lg text-4xl lg:text-5xl leading-none font-black text-primary tabular-nums"
                                    >
                                        {grandTotal.toFixed(2)}
                                    </motion.span>
                                    <span className="ml-2 text-xs font-black opacity-20">DH</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-8 space-y-4">
                        <button 
                            onClick={handleOrder}
                            disabled={isSubmitting}
                            className="w-full py-5 bg-primary text-on-primary text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 rounded-xl cinematic-shadow"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    <span>Authorize Manifest</span>
                                    <ArrowRight className="w-4 h-4 text-background" strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                        <p className="text-[8px] font-black text-background/20 text-center uppercase tracking-widest">Protocol 12-X Secured</p>
                    </div>
                </div>
            </aside>
        </div>
      </main>
    </div>
  );
};
