import React, { useRef, useState } from 'react';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as any }
  }
};

export const CheckoutPage: React.FC = () => {
  const { items, updateQty, removeItem, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tipPercent, setTipPercent] = useState<number>(0);
  const navigate = useNavigate();

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.plat.prix) * item.quantite), 0);
  const serviceTax = subtotal * 0.08;
  const tipAmount = subtotal * (tipPercent / 100);
  const grandTotal = subtotal + serviceTax + tipAmount;

  const handleOrder = async () => {
    if (isSubmittingRef.current || isSubmitting) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await api.post('/commandes/', {
        type: 'SUR_PLACE',
        lignes: items.map(i => ({
          plat: i.plat.id,
          quantite: i.quantite,
          notes: ''
        }))
      });
      setIsSuccess(true);
      clearCart();
      toast.success('Commande validée');
    } catch (err: any) {
      toast.error('Une erreur est survenue');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (isSuccess) return (
    <div className="page-shell flex flex-col items-center justify-center p-6 text-center min-h-[85vh] bg-background">
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl bg-surface border border-outline rounded-2xl p-8 sm:p-12 relative overflow-hidden shadow-premium"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center gap-10">
                <motion.div
                    initial={{ scale: 0, rotate: -20, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 10, stiffness: 150, delay: 0.1 }}
                    className="relative"
                >
                    <motion.div
                        className="w-20 h-20 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-success"
                    >
                        <CheckCircle2 className="w-10 h-10" strokeWidth={1.5} />
                    </motion.div>
                </motion.div>
                
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-on-background lowercase font-heading leading-tight">Merci pour votre commande.</h2>
                    <p className="text-sm text-on-surface-muted leading-relaxed max-w-sm mx-auto">Votre sélection a bien été transmise à la cuisine et commence à être préparée.</p>
                </div>

                <div className="w-full grid grid-cols-2 gap-6 py-6 border-y border-outline/50">
                    <div className="text-center space-y-1">
                        <span className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.25em]">Statut</span>
                        <p className="text-lg font-bold text-on-background">En préparation</p>
                    </div>
                    <div className="text-center space-y-1 border-l border-outline/50">
                        <span className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-[0.25em]">Temps estimé</span>
                        <div className="flex items-center justify-center gap-1.5 text-accent text-lg font-bold">
                           <Timer className="w-4 h-4 text-accent" strokeWidth={2} />
                           <span>25 min</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full pt-2">
                    <button onClick={() => navigate('/account')} className="btn-primary flex-1 h-12">Suivre la commande</button>
                    <button onClick={() => navigate('/')} className="btn-secondary flex-1 h-12 gap-2"><Home className="w-4 h-4" /> <span>Accueil</span></button>
                </div>
            </div>
        </motion.div>
    </div>
  );

  if (items.length === 0) return (
    <div className="page-shell flex flex-col items-center justify-center p-8 text-center min-h-[80vh] bg-background">
        <div className="max-w-md space-y-8">
            <div className="w-16 h-16 bg-surface-container-high rounded-full border border-outline flex items-center justify-center mx-auto text-on-surface-subtle">
                <ShoppingBag className="w-6 h-6 text-accent" />
            </div>
            <div className="space-y-3">
                <h2 className="text-3xl font-bold text-on-background lowercase font-heading">Votre panier est vide.</h2>
                <p className="text-sm text-on-surface-muted leading-relaxed max-w-xs mx-auto">Parcourez notre carte gourmande pour ajouter vos mets favoris.</p>
            </div>
            <button 
              onClick={() => navigate('/menu')} 
              className="btn-primary min-h-12 px-10"
            >
              Voir la carte
            </button>
        </div>
    </div>
  );

  return (
    <div className="page-shell bg-background">
      <main className="max-w-6xl mx-auto px-client-margin page-section">
        
        {/* Page Header */}
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 sm:gap-6 mb-10 border-b border-outline/50 pb-6"
        >
            <button aria-label="Retour à la carte" onClick={() => navigate('/menu')} className="w-11 h-11 bg-surface rounded-full hover:bg-surface-container-high transition-all duration-300 border border-outline flex items-center justify-center text-on-surface active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
            <div>
               <span className="text-[9px] font-bold text-accent tracking-[0.25em] uppercase block mb-0.5">Commande</span>
               <h1 className="text-2xl sm:text-3xl font-bold text-on-background tracking-tight lowercase font-heading">Mon panier.</h1>
            </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left: Summary (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                >
                    <AnimatePresence mode="popLayout">
                        {items.map(item => (
                            <motion.div 
                                key={item.plat.id} 
                                layout 
                                variants={itemVariants}
                                exit={{ opacity: 0, x: 20, transition: { duration: 0.3 } }}
                                className="p-4 sm:p-5 bg-surface border border-outline rounded-xl flex flex-col sm:flex-row items-center gap-6 group transition-all duration-300 hover:border-accent/30 shadow-premium"
                            >
                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-container-high border border-outline shrink-0">
                                    {item.plat.image ? (
                                        <img src={item.plat.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={item.plat.nom} loading="lazy" decoding="async" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-surface-container-high text-on-surface-subtle font-bold text-2xl">{item.plat.nom.charAt(0)}</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-center sm:text-left">
                                    <h3 className="text-lg font-bold tracking-tight text-on-background truncate">{item.plat.nom}</h3>
                                    <p className="font-mono text-sm text-accent font-semibold mt-1">{parseFloat(item.plat.prix).toFixed(0)} DH</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center bg-background border border-outline rounded-full p-1 shadow-sm">
                                        <button aria-label={`Diminuer la quantité pour ${item.plat.nom}`} onClick={() => updateQty(item.plat.id, -1)} className="btn-icon min-h-[36px] min-w-[36px] border-transparent bg-transparent hover:bg-surface-container-high"><Minus className="w-3.5 h-3.5" /></button>
                                        <span className="font-mono text-xs font-semibold w-8 text-center tabular-nums text-on-background">{item.quantite}</span>
                                        <button aria-label={`Augmenter la quantité pour ${item.plat.nom}`} onClick={() => updateQty(item.plat.id, 1)} className="btn-icon min-h-[36px] min-w-[36px] border-transparent bg-transparent hover:bg-surface-container-high"><Plus className="w-3.5 h-3.5" /></button>
                                    </div>
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        aria-label={`Retirer ${item.plat.nom} du panier`} 
                                        onClick={() => removeItem(item.plat.id)} 
                                        className="p-2.5 rounded-full border border-outline bg-surface text-on-surface-variant hover:text-error hover:border-error/20 transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* Tip Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="p-6 bg-surface border border-outline rounded-xl space-y-6 shadow-premium"
                >
                    <div>
                        <span className="text-[9px] font-bold text-accent uppercase tracking-[0.25em] block mb-0.5">Pourboire</span>
                        <h3 className="text-base font-bold text-on-background leading-tight">Soutenir nos équipes</h3>
                        <p className="text-xs text-on-surface-muted mt-1 leading-relaxed">Ajoutez un geste pour soutenir notre service en cuisine et en salle.</p>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {[10, 15, 20, 25].map(p => (
                            <button 
                                key={p} onClick={() => setTipPercent(tipPercent === p ? 0 : p)}
                                className={`py-3.5 rounded-xl border font-semibold text-xs transition-all duration-300 ${tipPercent === p ? 'bg-primary border-primary text-on-primary shadow-md scale-[1.02]' : 'bg-background border-outline text-on-surface-subtle hover:border-accent hover:text-accent'}`}
                            >
                                {p}%
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Right: Summary (4 cols) */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24">
                <motion.div 
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-surface border border-outline rounded-xl p-6 flex flex-col gap-6 shadow-premium relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[50px] -mr-24 -mt-24 pointer-events-none" />
                    
                    <div className="relative z-10 space-y-5">
                        <div className="flex items-center gap-2 pb-3 border-b border-outline/50">
                            <CreditCard className="w-4 h-4 text-accent" strokeWidth={2} />
                            <h3 className="text-[10px] font-bold text-on-surface uppercase tracking-[0.25em]">Récapitulatif</h3>
                        </div>

                        <div className="space-y-3.5 text-xs text-on-surface-muted">
                            <div className="flex justify-between"><span>Sous-total</span><span className="font-mono">{subtotal.toFixed(0)} DH</span></div>
                            <div className="flex justify-between"><span>Taxes & Service (8%)</span><span className="font-mono">{serviceTax.toFixed(0)} DH</span></div>
                            {tipPercent > 0 && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex justify-between text-accent font-semibold">
                                    <span>Pourboire ({tipPercent}%)</span><span className="font-mono">{tipAmount.toFixed(0)} DH</span>
                                </motion.div>
                            )}
                            
                            <div className="pt-6 border-t border-outline/50 flex justify-between items-baseline">
                                <span className="text-lg font-bold text-on-background lowercase font-heading">Total</span>
                                <div className="text-right">
                                    <span className="text-3xl font-bold text-primary font-mono tracking-tight">{grandTotal.toFixed(0)}</span>
                                    <span className="ml-1 text-[10px] font-bold text-on-surface-subtle uppercase">DH</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 pt-2">
                        <button 
                            onClick={handleOrder} disabled={isSubmitting}
                            className="btn-primary w-full h-12 shadow-sm flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin text-on-primary" /> : <span className="flex items-center gap-2">Valider la commande <ArrowRight className="w-4 h-4" /></span>}
                        </button>
                    </div>
                </motion.div>
            </aside>
        </div>
      </main>
    </div>
  );
};
