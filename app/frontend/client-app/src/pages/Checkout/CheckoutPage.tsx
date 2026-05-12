import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center animate-in zoom-in-95 duration-1000 bg-background">
        <div className="relative inline-flex items-center justify-center mb-8 md:mb-12">
            <div className="absolute inset-0 bg-primary opacity-10 blur-3xl rounded-full scale-150" />
            <div className="relative w-24 md:w-32 h-24 md:h-32 rounded-full bg-white double-bezel flex items-center justify-center text-primary">
                <PackageCheck className="w-12 md:w-16 h-12 md:h-16" />
            </div>
        </div>
        <h2 className="text-4xl md:text-5xl font-display-accent italic tracking-tight text-on-surface mb-4 md:mb-6 leading-none">Order Secured.</h2>
        <p className="text-lg md:text-xl text-on-surface-variant font-medium leading-relaxed max-w-md mb-8 md:mb-12">Our master chefs have received your request and are beginning the culinary orchestration.</p>
        <button 
          onClick={() => navigate('/account')} 
          className="w-full sm:w-auto px-12 py-5 bg-on-surface text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-on-surface/10"
        >
          Track My Order
        </button>
    </div>
  );

  if (items.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center py-24 md:py-32 gap-8 md:gap-10 bg-background">
        <div className="w-20 md:w-24 h-20 md:h-24 rounded-full bg-surface-container-low border-2 border-dashed border-surface-container-high flex items-center justify-center text-on-surface-variant opacity-30">
            <ShoppingBag className="w-8 md:w-10 h-8 md:h-10" />
        </div>
        <div>
            <h2 className="text-2xl md:text-3xl font-display-accent italic text-on-surface mb-2 md:mb-3">Your palette is waiting.</h2>
            <p className="text-sm md:text-on-surface-variant font-medium opacity-60">Add signature dishes from our menu to begin your journey.</p>
        </div>
        <button 
          onClick={() => navigate('/menu')} 
          className="w-full sm:w-auto px-10 py-4 bg-primary text-white rounded-xl font-bold transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/20 active:scale-95 shadow-lg shadow-primary/10"
        >
          Explore Menu
        </button>
    </div>
  );

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-5 md:px-8 py-10 md:py-24 animate-in fade-in duration-700 bg-background">
        <div className="flex items-center gap-4 md:gap-6 mb-10 md:mb-16">
          <button onClick={() => navigate('/menu')} className="p-2 md:p-3 bg-surface-container rounded-xl hover:bg-surface-container-high transition-all active:scale-90">
            <ChevronLeft className="w-5 md:w-6 h-5 md:h-6 text-on-surface" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-sans tracking-tight text-on-surface">Your Collection</h1>
            <p className="text-sm md:text-on-surface-variant font-medium mt-1 font-sans">Review your selected dishes before finalization.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            <div className="lg:col-span-7 space-y-4 md:space-y-6">
                {items.map(item => (
                    <div key={item.plat.id} className="p-4 md:p-6 bg-white double-bezel flex items-center gap-4 md:gap-8 transition-all hover:bg-surface-container-lowest hover:shadow-xl hover:shadow-primary/5">
                        <div className="w-20 md:w-28 h-20 md:h-28 rounded-xl overflow-hidden bg-surface-container-low shrink-0 relative group">
                            {item.plat.image ? (
                                <img src={item.plat.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.plat.nom} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-on-surface-variant opacity-20 font-bold text-2xl md:text-3xl font-display-accent italic">
                                    {item.plat.nom.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base md:text-xl text-on-surface truncate font-sans tracking-tight mb-1 md:mb-2">{item.plat.nom}</h3>
                            <p className="text-primary font-bold text-xs md:text-sm uppercase tracking-widest font-sans">{item.plat.prix} DH</p>
                        </div>
                        <div className="flex flex-col items-end gap-3 md:gap-4">
                            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg md:rounded-xl border border-surface-container-high shadow-sm">
                                <button onClick={() => updateQty(item.plat.id, -1)} className="w-6 md:w-8 h-6 md:h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-75"><Minus className="w-3.5 h-3.5" /></button>
                                <span className="font-bold text-xs md:text-sm w-6 md:w-8 text-center text-on-surface font-sans">{item.quantite}</span>
                                <button onClick={() => updateQty(item.plat.id, 1)} className="w-6 md:w-8 h-6 md:h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-75"><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                            <button onClick={() => removeItem(item.plat.id)} className="p-1.5 text-on-surface-variant opacity-40 hover:text-error hover:bg-error-container/30 rounded-lg transition-all active:scale-75">
                                <Trash2 className="w-4 md:w-5 h-4 md:h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="lg:col-span-5 space-y-6 md:space-y-10">
                <div className="p-6 md:p-10 bg-on-surface text-white rounded-2xl md:rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-10 blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000" />
                    <h3 className="text-xl md:text-2xl font-bold mb-8 md:mb-10 font-sans tracking-tight relative z-10 flex items-center gap-3">
                        <CreditCard className="w-5 md:w-6 h-5 md:h-6 text-primary" />
                        Transactional Protocol
                    </h3>
                    <div className="space-y-4 md:space-y-6 mb-10 md:mb-12 relative z-10">
                        <div className="flex justify-between text-white/50 text-xs md:text-sm font-bold uppercase tracking-widest">
                            <span>Catalog Value</span>
                            <span className="text-white font-sans">{total.toFixed(2)} DH</span>
                        </div>
                        <div className="flex justify-between items-center text-white/50 text-xs md:text-sm font-bold uppercase tracking-widest">
                            <span>Service Complexity</span>
                            <span className="text-primary font-black bg-primary/20 px-2 md:px-3 py-0.5 md:py-1 rounded-lg">OFFERED</span>
                        </div>
                        <div className="pt-6 md:pt-8 border-t border-white/10 flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-[8px] md:text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Final Settlement</span>
                                <span className="text-base md:text-lg font-bold">Total Payable</span>
                            </div>
                            <span className="text-3xl md:text-5xl font-bold font-sans tracking-tighter text-primary">{total.toFixed(2)}DH</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-[10px] md:text-xs text-center font-bold animate-in shake duration-500">
                            {error}
                        </div>
                    )}

                    <button 
                        onClick={handleOrder}
                        disabled={isSubmitting}
                        className="w-full py-4 md:py-5 bg-primary text-white rounded-xl md:rounded-2xl font-bold text-base md:text-lg flex items-center justify-center gap-3 md:gap-4 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20 active:scale-95 disabled:opacity-50 relative z-10"
                    >
                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>
                                <span>Authorize Order</span>
                                <ArrowRight className="w-5 md:w-6 h-5 md:h-6" />
                            </>
                        )}
                    </button>
                </div>
                <div className="px-6 md:px-10 text-center space-y-4">
                    <p className="text-[8px] md:text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40 leading-relaxed">
                        By authorizing this order, you agree to our premium hospitality protocols. Payment settlement will occur at physical retrieval.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};
