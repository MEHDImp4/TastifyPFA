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
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] }
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
        type: 'EMPORTER',
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
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-background font-body min-h-[85vh] selection:bg-primary/20">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-full max-w-2xl bg-surface-container border border-outline-variant rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl"
        >
            <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
                className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32" 
            />
            
            <div className="relative z-10 flex flex-col items-center gap-12">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="w-24 h-24 rounded-full bg-surface-container-highest border border-primary/20 flex items-center justify-center text-primary shadow-inner"
                >
                    <CheckCircle2 className="w-12 h-12" strokeWidth={1} />
                </motion.div>
                
                <div className="space-y-6">
                    <motion.h2 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-4xl md:text-6xl text-primary leading-none italic font-serif m-0"
                    >
                        Merci pour votre <br/> commande
                    </motion.h2>
                    <motion.p 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-lg text-on-surface-variant uppercase tracking-[0.2em] font-medium leading-relaxed max-w-sm mx-auto opacity-70"
                    >
                        Votre commande a été transmise à l'orchestre culinaire.
                    </motion.p>
                </div>

                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="w-full grid grid-cols-2 gap-8 py-10 border-y border-outline-variant/30"
                >
                    <div className="text-center space-y-2">
                        <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Référence</span>
                        <p className="font-serif text-2xl text-on-surface italic">#CMD-8924</p>
                    </div>
                    <div className="text-center space-y-2 border-l border-outline-variant/30">
                        <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Attente Estimée</span>
                        <div className="flex items-center justify-center gap-2 text-primary font-serif text-2xl italic">
                           <Timer className="w-5 h-5" />
                           <span>25 min</span>
                        </div>
                    </div>
                </motion.div>

                <div className="flex flex-col sm:flex-row gap-6 w-full pt-4">
                    <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/account')} 
                        className="flex-1 py-6 bg-on-surface text-background rounded-2xl font-sans text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-primary transition-all"
                    >
                        Suivre la commande
                    </motion.button>
                    <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/')} 
                        className="flex-1 py-6 border border-outline-variant text-on-surface rounded-2xl font-sans text-[11px] font-black uppercase tracking-[0.4em] hover:bg-surface-container-highest transition-all flex items-center justify-center gap-3"
                    >
                        <Home className="w-4 h-4" /> Accueil
                    </motion.button>
                </div>
            </div>
        </motion.div>
    </div>
  );

  if (items.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background font-body min-h-[80vh]">
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md space-y-12"
        >
            <div className="w-20 h-20 bg-surface-container-high rounded-full border border-outline-variant/30 flex items-center justify-center mx-auto text-on-surface-variant/20">
                <ShoppingBag className="w-10 h-10" />
            </div>
            <div className="space-y-6">
                <h2 className="text-4xl lg:text-6xl text-on-surface leading-tight italic font-serif">Votre panier <br /><span className="text-on-surface-variant">est vide.</span></h2>
                <p className="text-lg text-on-surface-variant uppercase tracking-widest leading-relaxed opacity-60">L'aventure culinaire commence par une sélection.</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/menu')} 
              className="px-12 py-5 bg-on-surface text-background rounded-full font-sans text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:bg-primary shadow-2xl"
            >
              Explorer la Carte
            </motion.button>
        </motion.div>
    </div>
  );

  return (
    <div className="flex-1 bg-background font-body selection:bg-primary/20 overflow-y-auto custom-scrollbar">
      <main className="max-w-7xl mx-auto px-client-margin py-12 md:py-24">
        
        {/* Page Header */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6 mb-16 border-b border-outline-variant pb-10"
        >
            <motion.button 
                whileHover={{ x: -4 }} whileTap={{ scale: 0.9 }}
                aria-label="Retour à la carte" 
                onClick={() => navigate('/menu')} 
                className="w-12 h-12 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-all border border-outline-variant/30 flex items-center justify-center text-on-surface"
            >
                <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <div>
               <h1 className="font-serif text-3xl md:text-5xl font-black text-on-surface tracking-tighter uppercase italic m-0">Votre Panier</h1>
               <p className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.4em] mt-3 italic opacity-60">Validation de votre sélection gastronomique</p>
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
                                        <img src={item.plat.image} className="w-full h-full object-cover transition-all duration-700 grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110" alt={item.plat.nom} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-serif italic text-3xl text-on-surface-variant/10">{item.plat.nom.charAt(0)}</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-center sm:text-left">
                                    <h3 className="font-serif text-xl font-black text-on-surface uppercase italic tracking-tight">{item.plat.nom}</h3>
                                    <p className="font-sans text-xs font-black text-primary uppercase mt-2 tracking-widest">{item.plat.prix} DH</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center bg-background border border-outline-variant/30 rounded-xl p-1.5 shadow-sm">
                                        <button aria-label={`Diminuer la quantité pour ${item.plat.nom}`} onClick={() => updateQty(item.plat.id, -1)} className="w-10 h-10 flex items-center justify-center text-on-surface hover:text-primary active:scale-75 transition-all"><Minus className="w-4 h-4" /></button>
                                        <span className="font-sans text-sm font-black w-10 text-center tabular-nums">{item.quantite}</span>
                                        <button aria-label={`Augmenter la quantité pour ${item.plat.nom}`} onClick={() => updateQty(item.plat.id, 1)} className="w-10 h-10 flex items-center justify-center text-on-surface hover:text-primary active:scale-75 transition-all"><Plus className="w-4 h-4" /></button>
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
                    className="p-8 bg-surface-container-low border border-outline-variant rounded-[2.5rem] space-y-8 shadow-sm"
                >
                    <div>
                        <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.4em]">Soutenir l'équipe</h3>
                        <p className="font-body text-[14px] text-on-surface-variant italic mt-1 opacity-60">Un geste pour honorer l'art de nos artisans en cuisine</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[10, 15, 20, 25].map(p => (
                            <motion.button 
                                key={p} 
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setTipPercent(p)}
                                className={`py-4 rounded-2xl border-2 font-sans text-xs font-black uppercase tracking-widest transition-all ${tipPercent === p ? 'bg-primary border-primary text-on-primary shadow-xl shadow-primary/20' : 'bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant hover:border-primary/50'}`}
                            >
                                {p}%
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Right: Summary (4 cols) */}
            <aside className="lg:col-span-4 sticky top-32">
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-surface-container-high border border-outline-variant rounded-[2.5rem] p-10 flex flex-col gap-10 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[60px] -mr-24 -mt-24 pointer-events-none" />
                    
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-4">
                            <CreditCard className="w-4 h-4 text-primary" />
                            <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.4em]">Manifeste de Commande</h3>
                        </div>

                        <div className="space-y-5 font-sans text-[11px] font-black uppercase tracking-widest">
                            <div className="flex justify-between text-on-surface-variant/70"><span>Sous-total</span><span>{subtotal.toFixed(0)} DH</span></div>
                            <div className="flex justify-between text-on-surface-variant/70"><span>Taxes & Service (8%)</span><span>{serviceTax.toFixed(0)} DH</span></div>
                            {tipPercent > 0 && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex justify-between text-primary">
                                    <span>Geste d'appréciation</span><span>{tipAmount.toFixed(0)} DH</span>
                                </motion.div>
                            )}
                            
                            <div className="pt-8 border-t border-outline-variant/30 flex justify-between items-end">
                                <span className="font-serif text-2xl text-on-surface italic m-0 lowercase">Investissement</span>
                                <div className="text-right">
                                    <span className="font-serif text-5xl font-black text-primary italic leading-none tabular-nums tracking-tighter">{grandTotal.toFixed(0)}</span>
                                    <span className="ml-2 text-xs font-black text-on-surface-variant">DH</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleOrder} disabled={isSubmitting}
                            className="w-full py-6 bg-primary text-on-primary rounded-2xl font-sans text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/40 hover:bg-[#B13D15] transition-all flex items-center justify-center gap-4"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Confirmer la Commande</span><ArrowRight className="w-4 h-4" /></>}
                        </motion.button>
                        <p className="text-[9px] text-center font-sans font-black text-on-surface-variant/40 uppercase tracking-[0.2em] px-4">
                            En confirmant, vous acceptez nos conditions d'excellence culinaire.
                        </p>
                    </div>
                </motion.div>
            </aside>
        </div>
      </main>
    </div>
  );
};
