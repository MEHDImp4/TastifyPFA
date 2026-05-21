import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api/axios';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Loader2, 
  PackageCheck,
  CreditCard,
  ChevronLeft
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { items, updateQty, removeItem, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const total = items.reduce((sum, item) => sum + (parseFloat(item.plat.prix) * item.quantite), 0);

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
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-1000 bg-background">
        <div className="relative inline-flex items-center justify-center mb-12">
            <div className="absolute inset-0 bg-primary opacity-10 blur-[100px] rounded-full scale-150 animate-pulse" />
            <div className="relative w-32 h-32 rounded-[2.5rem] bg-background border-2 border-primary/20 flex items-center justify-center text-primary cinematic-shadow">
                <PackageCheck className="w-16 h-16" strokeWidth={1} />
            </div>
        </div>
        <h2 className="text-display-lg text-5xl md:text-7xl text-on-surface leading-none mb-6">Order <br /><span className="italic font-light">Secured.</span></h2>
        <p className="text-xl font-body text-on-surface-variant leading-relaxed max-w-md mb-12 opacity-80">Our master chefs have received your manifest and are beginning the culinary orchestration.</p>
        <button 
          onClick={() => navigate('/account')} 
          className="w-full sm:w-auto px-16 py-6 bg-on-surface text-background text-[11px] font-black uppercase tracking-[0.3em] transition-all hover:bg-primary cinematic-shadow active:scale-95"
        >
          Track Progress
        </button>
    </div>
  );

  if (items.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center py-32 gap-12 bg-background">
        <div className="relative">
            <div className="absolute inset-0 bg-on-surface opacity-5 blur-[60px] rounded-full scale-150" />
            <div className="relative w-24 h-24 rounded-full bg-surface-container-high border-2 border-dashed border-on-surface/10 flex items-center justify-center text-on-surface-variant/40">
                <ShoppingBag className="w-10 h-10" strokeWidth={1} />
            </div>
        </div>
        <div className="space-y-4">
            <h2 className="text-display-lg text-4xl lg:text-5xl text-on-surface">Your palette <br /><span className="italic font-light">is waiting.</span></h2>
            <p className="text-lg font-body text-on-surface-variant opacity-60">Add signature dishes from our catalog to begin your journey.</p>
        </div>
        <button 
          onClick={() => navigate('/menu')} 
          className="w-full sm:w-auto px-12 py-5 bg-on-surface text-background text-[11px] font-black uppercase tracking-[0.3em] transition-all hover:bg-primary cinematic-shadow active:scale-95"
        >
          Explore Catalog
        </button>
    </div>
  );

  return (
    <div className="flex-1 max-w-[1400px] mx-auto w-full px-8 py-16 lg:py-32 animate-in fade-in duration-1000 bg-background">
        <div className="flex items-center gap-8 mb-20">
          <button onClick={() => navigate('/menu')} className="p-4 bg-surface-container rounded-full hover:bg-surface-container-high transition-all active:scale-90 border border-on-surface/5">
            <ChevronLeft className="w-6 h-6 text-on-surface" strokeWidth={2} />
          </button>
          <div className="space-y-2">
            <span className="editorial-kicker">Operational Cart</span>
            <h1 className="text-display-lg text-4xl md:text-6xl text-on-surface leading-none">Your Selection.</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
            <div className="lg:col-span-7 space-y-8">
                {items.map(item => (
                    <motion.div 
                        key={item.plat.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-8 editorial-card flex items-center gap-10 transition-all hover:bg-surface-container-low cinematic-shadow"
                    >
                        <div className="w-32 h-32 rounded-2xl overflow-hidden bg-surface-container-high shrink-0 relative group">
                            {item.plat.image ? (
                                <img src={item.plat.image} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" alt={item.plat.nom} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-on-surface/5 font-serif italic text-4xl">
                                    {item.plat.nom.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-2xl font-serif italic text-on-surface truncate tracking-tight mb-2 uppercase">{item.plat.nom}</h3>
                            <p className="text-ui-label-bold text-[10px] text-primary tracking-[0.2em]">{item.plat.prix} DH / UNIT</p>
                        </div>
                        <div className="flex flex-col items-end gap-6">
                            <div className="flex items-center bg-surface-container-high border border-on-surface/5 rounded-full p-1.5 shadow-inner">
                                <button onClick={() => updateQty(item.plat.id, -1)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-75"><Minus className="w-4 h-4" strokeWidth={2.5} /></button>
                                <span className="text-ui-data-dense font-black text-sm w-10 text-center text-on-surface">{item.quantite}</span>
                                <button onClick={() => updateQty(item.plat.id, 1)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-75"><Plus className="w-4 h-4" strokeWidth={2.5} /></button>
                            </div>
                            <button onClick={() => removeItem(item.plat.id)} className="text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant/30 hover:text-error transition-colors flex items-center gap-2">
                                <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                                Remove
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <aside className="lg:col-span-5 space-y-12 lg:sticky lg:top-40">
                <div className="p-12 bg-on-surface text-background rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary opacity-10 blur-[100px] -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-[2000ms]" />
                    
                    <div className="flex items-center justify-between mb-12 relative z-10">
                        <div className="flex items-center gap-4">
                            <CreditCard className="w-6 h-6 text-primary" strokeWidth={1.5} />
                            <h3 className="text-ui-label-bold text-[11px] tracking-[0.4em]">TRANSACTIONAL PROTOCOL</h3>
                        </div>
                        <span className="text-[9px] font-black text-primary/40 border border-primary/20 px-3 py-1 rounded-full uppercase">Registry Link</span>
                    </div>

                    <div className="space-y-8 mb-16 relative z-10">
                        <div className="flex justify-between items-center text-background/40 text-[10px] font-black uppercase tracking-[0.3em]">
                            <span>Catalog Value</span>
                            <span className="text-background">{total.toFixed(2)} DH</span>
                        </div>
                        <div className="flex justify-between items-center text-background/40 text-[10px] font-black uppercase tracking-[0.3em]">
                            <span>Service Surcharge</span>
                            <span className="text-primary font-black bg-primary/10 px-4 py-1 rounded-full">OFFERED</span>
                        </div>
                        <div className="pt-10 border-t border-background/5 flex justify-between items-end">
                            <div className="flex flex-col gap-2">
                                <span className="text-ui-label-bold text-[8px] text-background/20 tracking-[0.4em]">FINAL SETTLEMENT</span>
                                <span className="text-xl text-background/60 font-body italic">Total Payable</span>
                            </div>
                            <div className="text-right">
                                <span className="text-display-lg text-5xl md:text-7xl text-primary leading-none">{total.toFixed(2)}</span>
                                <span className="text-ui-label-bold text-lg ml-4 text-background/20">DH</span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-10 p-6 bg-error text-on-error border-2 border-on-surface text-[10px] font-black tracking-[0.2em] text-center uppercase animate-in shake duration-500">
                            COMMUNICATION ERR: {error}
                        </div>
                    )}

                    <button 
                        onClick={handleOrder}
                        disabled={isSubmitting}
                        className="w-full py-7 bg-primary text-on-primary text-[12px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-6 transition-all hover:scale-[1.02] cinematic-shadow active:scale-95 disabled:opacity-50 relative z-10"
                    >
                        {isSubmitting ? <Loader2 className="w-7 h-7 animate-spin" strokeWidth={2.5} /> : (
                            <>
                                <span>Authorize Orchestration</span>
                                <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                            </>
                        )}
                    </button>
                </div>
                
                <div className="px-12 text-center space-y-6">
                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.3em] opacity-40 leading-relaxed">
                        By authorizing this request, you agree to our premium hospitality protocols. Payment settlement will occur at physical retrieval via encrypted digital channel.
                    </p>
                </div>
            </aside>
        </div>
    </div>
  );
};
