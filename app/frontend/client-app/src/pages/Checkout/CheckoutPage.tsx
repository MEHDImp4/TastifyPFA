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
      setIsSubmitting(false);
    }
  };

  if (isSuccess) return (
    <div className="page-shell flex flex-col items-center justify-center p-6 text-center min-h-[85vh]">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-surface-container border border-outline-variant rounded-lg p-6 sm:p-8 md:p-14 relative overflow-hidden shadow-xl"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32" />
            
            <div className="relative z-10 flex flex-col items-center gap-12">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 10, stiffness: 180, delay: 0.25 }}
                    className="w-24 h-24 rounded-full bg-surface-container-highest border border-primary/20 flex items-center justify-center text-primary"
                >
                    <CheckCircle2 className="w-12 h-12" strokeWidth={1} />
                </motion.div>
                
                <div className="space-y-6">
                    <h2 className="text-display-lg-mobile md:text-display-lg text-primary leading-none m-0">Merci pour votre commande</h2>
                    <p className="text-base md:text-lg text-on-surface-variant font-medium leading-relaxed max-w-sm mx-auto">Votre commande a été transmise à la cuisine.</p>
                </div>

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 py-8 sm:py-10 border-y border-outline-variant/30">
                    <div className="text-center space-y-2">
                        <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Réf. Commande</span>
                        <p className=" text-2xl text-on-surface ">#CMD-8924</p>
                    </div>
                    <div className="text-center space-y-2 sm:border-l border-outline-variant/30">
                        <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Temps Estimé</span>
                        <div className="flex items-center justify-center gap-2 text-primary  text-2xl ">
                           <Timer className="w-5 h-5" />
                           <span>25 min</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 w-full pt-4">
                    <button onClick={() => navigate('/account')} className="btn-primary flex-1 h-14">Voir ma commande</button>
                    <button onClick={() => navigate('/')} className="btn-secondary flex-1 h-14"><Home className="w-4 h-4" /> Retour à l'Accueil</button>
                </div>
            </div>
        </motion.div>
    </div>
  );

  if (items.length === 0) return (
    <div className="page-shell flex flex-col items-center justify-center p-8 text-center min-h-[80vh]">
        <div className="max-w-md space-y-12">
            <div className="w-20 h-20 bg-surface-container-high rounded-full border border-outline-variant/30 flex items-center justify-center mx-auto text-on-surface-variant/20">
                <ShoppingBag className="w-10 h-10" />
            </div>
            <div className="space-y-6">
                <h2 className="text-display-lg text-4xl lg:text-6xl text-on-surface leading-tight ">Votre panier <br /><span className="text-on-surface-variant">est vide.</span></h2>
                <p className="text-base sm:text-lg text-on-surface-variant uppercase tracking-wider sm:tracking-widest leading-relaxed">Ajoutez des plats de notre carte pour commencer.</p>
            </div>
            <button 
              onClick={() => navigate('/menu')} 
              className="btn-primary min-h-14 px-10"
            >
              Explorer la Carte
            </button>
        </div>
    </div>
  );

  return (
    <div className="page-shell">
      <main className="max-w-7xl mx-auto px-client-margin page-section">
        
        {/* Page Header */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 sm:gap-6 mb-10 md:mb-16 border-b border-outline-variant pb-8 md:pb-10"
        >
            <button aria-label="Retour à la carte" onClick={() => navigate('/menu')} className="w-12 h-12 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-all border border-outline-variant/30 flex items-center justify-center text-on-surface active:scale-90"><ChevronLeft className="w-5 h-5" /></button>
            <div>
               <h1 className=" text-3xl md:text-5xl font-black text-on-surface tracking-tighter uppercase  m-0">Votre Panier</h1>
               <p className="font-sans text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-3">Validation de votre commande</p>
            </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            {/* Left: Summary (8 cols) */}
            <div className="lg:col-span-8 space-y-12">
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
                                className="p-6 bg-surface-container border border-outline-variant rounded-2xl flex flex-col sm:flex-row items-center gap-8 group transition-all hover:border-primary/40 hover:bg-surface-bright shadow-sm hover:shadow-md"
                            >
                                <div className="w-24 h-24 rounded-xl overflow-hidden bg-surface-container-highest border border-outline-variant/30 shrink-0 shadow-inner">
                                    {item.plat.image ? (
                                        <img src={item.plat.image} className="w-full h-full object-cover transition-all duration-700 grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110" alt={item.plat.nom} loading="lazy" decoding="async" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center   text-3xl text-on-surface-variant/10">{item.plat.nom.charAt(0)}</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-center sm:text-left">
                                    <h3 className=" text-xl font-black text-on-surface uppercase  tracking-tight">{item.plat.nom}</h3>
                                    <p className="font-sans text-xs font-black text-primary uppercase mt-2 tracking-widest">{item.plat.prix} DH</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center bg-background border border-outline-variant/30 rounded-xl p-1.5 shadow-sm">
                                        <button aria-label={`Diminuer la quantité pour ${item.plat.nom}`} onClick={() => updateQty(item.plat.id, -1)} className="btn-icon border-transparent bg-transparent"><Minus className="w-4 h-4" /></button>
                                        <span className="font-sans text-sm font-black w-10 text-center tabular-nums">{item.quantite}</span>
                                        <button aria-label={`Augmenter la quantité pour ${item.plat.nom}`} onClick={() => updateQty(item.plat.id, 1)} className="btn-icon border-transparent bg-transparent"><Plus className="w-4 h-4" /></button>
                                    </div>
                                    <motion.button 
                                        whileHover={{ rotate: 15, scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        aria-label={`Retirer ${item.plat.nom} du panier`} 
                                        onClick={() => removeItem(item.plat.id)} 
                                        className="p-3 text-on-surface-variant hover:text-error transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* Tip Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="p-6 md:p-8 bg-surface-container-low border border-outline-variant rounded-lg space-y-8"
                >
                    <div>
                        <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em]">Ajouter un pourboire</h3>
                        <p className="font-body text-[14px] text-on-surface-variant  mt-1 font-medium">Pour soutenir nos équipes en cuisine et en salle</p>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {[10, 15, 20, 25].map(p => (
                            <button 
                                key={p} onClick={() => setTipPercent(p)}
                                className={`py-4 rounded-2xl border-2 font-sans text-xs font-black uppercase tracking-widest transition-all ${tipPercent === p ? 'bg-primary border-primary text-on-primary shadow-xl scale-105' : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-primary/50'}`}
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
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-surface-container-high border border-outline-variant rounded-lg p-6 md:p-8 flex flex-col gap-8 shadow-xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[60px] -mr-24 -mt-24 pointer-events-none" />
                    
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-4 h-4 text-primary" />
                            <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.3em]">Résumé</h3>
                        </div>

                        <div className="space-y-4 font-sans text-[11px] font-black uppercase tracking-widest">
                            <div className="flex justify-between text-on-surface-variant"><span>Sous-total</span><span>{subtotal.toFixed(0)} DH</span></div>
                            <div className="flex justify-between text-on-surface-variant"><span>Taxes & Service (8%)</span><span>{serviceTax.toFixed(0)} DH</span></div>
                            {tipPercent > 0 && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex justify-between text-primary">
                                    <span>Pourboire</span><span>{tipAmount.toFixed(0)} DH</span>
                                </motion.div>
                            )}
                            
                            <div className="pt-8 border-t border-outline-variant/30 flex justify-between items-end">
                                <span className=" text-2xl text-on-surface  m-0 lowercase">Total</span>
                                <div className="text-right">
                                    <span className=" text-5xl font-black text-primary  leading-none tabular-nums tracking-tighter">{grandTotal.toFixed(0)}</span>
                                    <span className="ml-2 text-xs font-black text-on-surface-variant">DH</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleOrder} disabled={isSubmitting}
                            className="btn-primary w-full min-h-14 gap-4"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Valider la commande</span><ArrowRight className="w-4 h-4" /></>}
                        </motion.button>
                    </div>
                </motion.div>
            </aside>
        </div>
      </main>
    </div>
  );
};
