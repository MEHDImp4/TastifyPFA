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
  CheckCircle2,
  Timer,
  Home
} from 'lucide-react';
import { toast } from 'sonner';

export const CheckoutPage: React.FC = () => {
  const { items, updateQty, removeItem, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tipPercent, setTipPercent] = useState<number>(0);
  const navigate = useNavigate();

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.plat.prix) * item.quantite), 0);
  const serviceTax = subtotal * 0.08;
  const tipAmount = subtotal * (tipPercent / 100);
  const grandTotal = subtotal + serviceTax + tipAmount;

  const handleOrder = async () => {
    setIsSubmitting(true);
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
      toast.success('Manifest Secured');
    } catch (err: any) {
      toast.error('Protocol Breach');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-background font-body min-h-[85vh] selection:bg-primary/20">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-surface-container border border-outline-variant rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32" />
            
            <div className="relative z-10 flex flex-col items-center gap-12">
                <div className="w-24 h-24 rounded-full bg-surface-container-highest border border-primary/20 flex items-center justify-center text-primary">
                    <CheckCircle2 className="w-12 h-12" strokeWidth={1} />
                </div>
                
                <div className="space-y-6">
                    <h2 className="text-display-lg-mobile md:text-display-lg text-primary leading-none italic m-0">Merci pour votre commande</h2>
                    <p className="text-lg text-on-surface-variant uppercase tracking-[0.1em] font-medium leading-relaxed max-w-sm mx-auto">Votre sélection a été transmise à nos cuisines avec succès.</p>
                </div>

                <div className="w-full grid grid-cols-2 gap-8 py-10 border-y border-outline-variant/30">
                    <div className="text-center space-y-2">
                        <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Order Ref</span>
                        <p className="font-serif text-2xl text-on-surface italic">#ORD-8924</p>
                    </div>
                    <div className="text-center space-y-2 border-l border-outline-variant/30">
                        <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Estimated Prep</span>
                        <div className="flex items-center justify-center gap-2 text-primary font-serif text-2xl italic">
                           <Timer className="w-5 h-5" />
                           <span>25 mins</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 w-full pt-4">
                    <button onClick={() => navigate('/account')} className="flex-1 py-6 bg-primary text-on-primary rounded-2xl font-sans text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Track Order</button>
                    <button onClick={() => navigate('/')} className="flex-1 py-6 border border-outline-variant text-on-surface rounded-2xl font-sans text-[11px] font-black uppercase tracking-[0.4em] hover:bg-surface-container-highest transition-all flex items-center justify-center gap-3"><Home className="w-4 h-4" /> Return Home</button>
                </div>
            </div>
        </motion.div>
    </div>
  );

  if (items.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background font-body min-h-[80vh]">
        <div className="max-w-md space-y-12">
            <div className="w-20 h-20 bg-surface-container-high rounded-full border border-outline-variant/30 flex items-center justify-center mx-auto text-on-surface-variant/20">
                <ShoppingBag className="w-10 h-10" />
            </div>
            <div className="space-y-6">
                <h2 className="text-display-lg text-4xl lg:text-6xl text-on-surface leading-tight italic">Your palette <br /><span className="opacity-40">is waiting.</span></h2>
                <p className="text-lg text-on-surface-variant uppercase tracking-widest leading-relaxed opacity-60">Add signature creations from our catalog to begin your journey.</p>
            </div>
            <button 
              onClick={() => navigate('/menu')} 
              className="px-12 py-5 bg-on-surface text-background rounded-full font-sans text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:bg-primary shadow-2xl active:scale-95"
            >
              Explore Catalog
            </button>
        </div>
    </div>
  );

  return (
    <div className="flex-1 bg-background font-body selection:bg-primary/20 overflow-y-auto custom-scrollbar">
      <main className="max-w-7xl mx-auto px-client-margin py-12 md:py-24">
        
        {/* Page Header */}
        <div className="flex items-center gap-6 mb-16 border-b border-outline-variant pb-10">
            <button onClick={() => navigate('/menu')} className="w-12 h-12 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-all border border-outline-variant/30 flex items-center justify-center text-on-surface"><ChevronLeft className="w-5 h-5" /></button>
            <div>
               <h1 className="font-serif text-3xl md:text-5xl font-black text-on-surface tracking-tighter uppercase italic m-0">Review Your Selection</h1>
               <p className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.4em] mt-3">Final validation protocol</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            {/* Left: Summary (8 cols) */}
            <div className="lg:col-span-8 space-y-12">
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {items.map(item => (
                            <motion.div 
                                key={item.plat.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="p-6 bg-surface-container border border-outline-variant rounded-2xl flex items-center gap-8 group transition-all hover:border-primary/40"
                            >
                                <div className="w-24 h-24 rounded-xl overflow-hidden bg-surface-container-highest border border-outline-variant/30 shrink-0">
                                    {item.plat.image ? (
                                        <img src={item.plat.image} className="w-full h-full object-cover transition-all duration-700 grayscale-[0.2] group-hover:grayscale-0" alt={item.plat.nom} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-serif italic text-3xl text-on-surface-variant/10">{item.plat.nom.charAt(0)}</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-serif text-xl font-black text-on-surface uppercase italic tracking-tight">{item.plat.nom}</h3>
                                    <p className="font-sans text-xs font-black text-primary uppercase mt-2">{item.plat.prix} DH</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center bg-background border border-outline-variant/30 rounded-xl p-1.5">
                                        <button onClick={() => updateQty(item.plat.id, -1)} className="w-10 h-10 flex items-center justify-center text-on-surface hover:text-primary active:scale-75 transition-all"><Minus className="w-4 h-4" /></button>
                                        <span className="font-sans text-sm font-black w-10 text-center tabular-nums">{item.quantite}</span>
                                        <button onClick={() => updateQty(item.plat.id, 1)} className="w-10 h-10 flex items-center justify-center text-on-surface hover:text-primary active:scale-75 transition-all"><Plus className="w-4 h-4" /></button>
                                    </div>
                                    <button onClick={() => removeItem(item.plat.id)} className="p-3 text-on-surface-variant hover:text-error transition-all active:scale-75"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Recognition */}
                <div className="p-8 bg-surface-container-low border border-outline-variant rounded-[2.5rem] space-y-8">
                    <div>
                        <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em]">Recognize Orchestration</h3>
                        <p className="font-body text-[14px] text-on-surface-variant italic opacity-60 mt-1">Gratuity for the culinary and service leads</p>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {[10, 15, 20, 25].map(p => (
                            <button 
                                key={p} onClick={() => setTipPercent(p)}
                                className={`py-4 rounded-2xl border-2 font-sans text-xs font-black uppercase tracking-widest transition-all ${tipPercent === p ? 'bg-primary border-primary text-on-primary shadow-xl' : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-primary/50'}`}
                            >
                                {p}%
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Settlement (4 cols) */}
            <aside className="lg:col-span-4 sticky top-32">
                <div className="bg-surface-container-high border border-outline-variant rounded-[2.5rem] p-10 flex flex-col gap-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[60px] -mr-24 -mt-24 pointer-events-none" />
                    
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-4 h-4 text-primary" />
                            <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.3em]">Settlement</h3>
                        </div>

                        <div className="space-y-4 font-sans text-[11px] font-black uppercase tracking-widest">
                            <div className="flex justify-between text-on-surface-variant opacity-60"><span>Subtotal</span><span>{subtotal.toFixed(0)} DH</span></div>
                            <div className="flex justify-between text-on-surface-variant opacity-60"><span>Tax & Svc (8%)</span><span>{serviceTax.toFixed(0)} DH</span></div>
                            {tipPercent > 0 && <div className="flex justify-between text-primary"><span>Reward</span><span>{tipAmount.toFixed(0)} DH</span></div>}
                            
                            <div className="pt-8 border-t border-outline-variant/30 flex justify-between items-end">
                                <span className="font-serif text-2xl text-on-surface italic m-0 lowercase">Total</span>
                                <div className="text-right">
                                    <span className="font-serif text-4xl font-black text-primary italic leading-none tabular-nums">{grandTotal.toFixed(0)}</span>
                                    <span className="ml-2 text-xs font-black text-on-surface opacity-30">DH</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <button 
                            onClick={handleOrder} disabled={isSubmitting}
                            className="w-full py-6 bg-primary text-on-primary rounded-2xl font-sans text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Authorize Manifest</span><ArrowRight className="w-4 h-4" /></>}
                        </button>
                        <p className="text-[8px] font-black text-on-surface-variant/20 text-center uppercase tracking-widest">Protocol 12-X Encrypted</p>
                    </div>
                </div>
            </aside>
        </div>
      </main>
    </div>
  );
};

