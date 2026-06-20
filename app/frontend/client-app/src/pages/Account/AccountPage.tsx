import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { LoyaltyProfile, Reward } from '../../api/loyalty';
import { loyaltyApi } from '../../api/loyalty';
import type { Reservation } from '../../api/reservations';
import { reservationApi } from '../../api/reservations';
import { avisApi } from '../../api/avis';
import { commandesApi } from '../../api/commandes';
import type { Commande } from '../../api/commandes';
import { useAuthStore } from '../../store/authStore';
import { 
  Award, 
  ShieldCheck, 
  LogOut, 
  ChevronRight,
  Calendar,
  MessageCircle,
  MoreVertical,
  CheckCircle2,
  Loader2,
  Quote,
  Settings,
  ShoppingBag,
  History,
  Gift,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export const AccountPage: React.FC = () => {
  const { username, logout } = useAuthStore();
  const [loyalty, setLoyalty] = useState<LoyaltyProfile | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasPaidOrders = orders.some(o => o.statut === 'PAYEE');
  useBodyScrollLock(isReviewModalOpen && hasPaidOrders);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loyaltyRes, rewardsRes, resRes, ordersRes] = await Promise.all([
          loyaltyApi.getMyStatus().catch(() => ({ data: { points: 1250, tier: 'GOLD', tier_display: 'OR' } as LoyaltyProfile })),
          loyaltyApi.getRewards().catch(() => ({ data: [
            { id: 1, nom: "Apéritif de Bienvenue", description: "Offert pour vous et vos invités dès votre arrivée.", points_requis: 500, is_available: true },
            { id: 2, nom: "Mignardises du Chef", description: "Une sélection de douceurs pour clore votre repas.", points_requis: 1200, is_available: true },
            { id: 3, nom: "Table Signature", description: "Garantie de la meilleure table de la maison.", points_requis: 3000, is_available: false }
          ] as Reward[] })),
          reservationApi.getMyReservations().catch(() => ({ data: [] })),
          commandesApi.getMyOrders().catch(() => ({ data: [] }))
        ]);
        setLoyalty(loyaltyRes.data);
        setRewards(rewardsRes.data);
        setReservations(resRes.data);
        setOrders(ordersRes.data);
      } catch (err) {
        console.error('Erreur lors de la récupération des données', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPaidOrders) {
        toast.error("Vous devez avoir réglé une commande pour donner votre avis.");
        return;
    }
    if (comment.trim().length < 10) {
        setReviewError('Votre avis doit contenir au moins 10 caractères.');
        return;
    }
    setIsSubmitting(true);
    try {
        await avisApi.createAvis({ commentaire: comment });
        toast.success('Avis enregistré');
        setIsReviewModalOpen(false);
        setComment('');
        setReviewError('');
    } catch (err) {
        toast.error('Échec de l\'envoi');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="page-shell flex flex-col items-center justify-center relative overflow-hidden">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6 relative z-10"
        >
            <Loader2 className="w-12 h-12 animate-spin text-on-background" strokeWidth={1.5}/>
            <span className="font-sans text-[10px] font-black text-on-surface-subtle uppercase tracking-[0.4em]">Chargement de votre espace</span>
        </motion.div>
        <div className="absolute inset-0 bg-on-background/5 blur-[100px] rounded-full" />
    </div>
  );

  return (
    <div className="page-shell bg-background min-h-screen">
      <main className="max-w-6xl mx-auto px-client-margin page-section space-y-16">
        
        {/* Profile Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 bg-surface border border-outline rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 md:gap-10 relative overflow-hidden shadow-premium group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
              
              <div className="w-28 h-28 rounded-full border border-outline bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0 shadow-lg relative">
                 <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=300" className="w-full h-full object-cover grayscale-[0.2]" alt="Avatar" loading="lazy" decoding="async" />
              </div>
 
              <div className="flex-1 text-center md:text-left space-y-4 z-10">
                 <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-on-background tracking-tight m-0 uppercase font-heading">{username}</h1>
                    <span className="text-[10px] font-bold text-accent tracking-[0.25em] uppercase block mt-1.5">Membre Privilège</span>
                 </div>
                 
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <div className="bg-surface-container-high border border-outline px-3.5 py-1.5 rounded-full flex items-center gap-2">
                       <Award className="w-4 h-4 text-accent" strokeWidth={2} />
                       <span className="text-[9px] font-bold text-on-background uppercase tracking-widest">{loyalty?.tier_display || 'OR'}</span>
                    </div>
                    <div className="bg-surface-container-high border border-outline px-3.5 py-1.5 rounded-full flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-success" strokeWidth={2} />
                       <span className="text-[9px] font-bold text-on-background uppercase tracking-widest">{loyalty?.points || 0} points</span>
                    </div>
                 </div>
              </div>
           </div>
 
           {/* Tier Progress Bento */}
           <div className="lg:col-span-4 bg-surface border border-outline rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-premium">
              <div className="space-y-4">
                 <span className="text-[9px] font-bold text-accent tracking-[0.25em] uppercase block">Fidélité</span>
                 <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden border border-outline/50">
                    <motion.div
                       initial={{ width: 0 }}
                       whileInView={{ width: '70%' }}
                       viewport={{ once: true }}
                       transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                       className="h-full bg-accent"
                    />
                 </div>
                 <p className="text-sm text-on-surface-muted leading-relaxed font-semibold">Bientôt un dessert offert ! Vous vous rapprochez de votre prochain avantage.</p>
              </div>
           </div>
        </section>
 
        {/* Privileges & Rewards Section */}
        <section className="space-y-8">
            <div className="flex justify-between items-end border-b border-outline/50 pb-5">
                <div>
                    <span className="text-[9px] font-bold text-accent tracking-[0.25em] uppercase block mb-1">Avantages</span>
                    <h2 className="text-2xl font-bold text-on-background tracking-tight lowercase font-heading">Échanger mes points.</h2>
                </div>
                <div className="flex items-center gap-2 text-on-surface-subtle">
                    <Zap className="w-4 h-4 text-accent fill-current" />
                    <span className="text-[9px] font-bold tracking-[0.2em] uppercase">Privilèges</span>
                </div>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {rewards.map((reward, idx) => {
                    const isUnlockable = (loyalty?.points || 0) >= reward.points_requis;
                    return (
                        <motion.div 
                            key={reward.id}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className={`p-6 rounded-xl border flex flex-col justify-between min-h-[240px] shadow-premium transition-all duration-300 ${isUnlockable ? 'bg-surface border-outline hover:border-accent/40 hover:-translate-y-0.5' : 'bg-surface-container-high/40 border-transparent/10 grayscale opacity-60'}`}
                        >
                            <div className="space-y-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isUnlockable ? 'bg-surface-container-high text-accent' : 'bg-surface-container-high/60 text-on-surface-subtle'}`}>
                                    <Gift className="w-5 h-5" strokeWidth={2} />
                                </div>
                                <div className="space-y-1.5">
                                    <h4 className="text-lg font-bold tracking-tight text-on-background">{reward.nom}</h4>
                                    <p className="text-xs text-on-surface-muted leading-relaxed line-clamp-3">{reward.description}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-t border-outline/50 pt-4">
                                <span className="font-mono text-xs font-bold text-accent">{reward.points_requis} points</span>
                                {isUnlockable ? (
                                    <button className="min-h-[44px] px-3 -mr-3 text-on-background font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-1 rounded-lg hover:text-accent transition-all">
                                      <span>En profiter</span> <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                ) : (
                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-on-surface-subtle">Verrouillé</span>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
 
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* Active Reservations & History */}
           <div className="lg:col-span-8 space-y-16">
              
              {/* Recent Orders */}
              <div className="space-y-8">
                 <div className="flex justify-between items-end border-b border-outline/50 pb-5">
                    <div>
                        <span className="text-[9px] font-bold text-accent tracking-[0.25em] uppercase block mb-1">Activité</span>
                        <h2 className="text-2xl font-bold text-on-background tracking-tight lowercase font-heading">Historique des commandes.</h2>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-subtle">
                        <History className="w-4 h-4" strokeWidth={2} />
                        <span className="text-[9px] font-bold tracking-[0.2em] uppercase">Commandes</span>
                    </div>
                 </div>
 
                 <div className="space-y-4">
                    {orders.length > 0 ? orders.map((order, idx) => (
                        <motion.div 
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-4 sm:p-5 bg-surface border border-outline rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 group transition-all duration-300 hover:border-accent/30 shadow-premium"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center text-accent border border-outline transition-all duration-500 group-hover:bg-accent group-hover:text-background">
                                    <ShoppingBag className="w-5 h-5" strokeWidth={2} />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold tracking-tight text-on-background">Commande #{order.id}</h4>
                                    <p className="text-xs text-on-surface-muted mt-0.5">
                                        {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} • <span className="font-semibold text-accent font-mono">{parseFloat(order.montant_total).toFixed(0)} DH</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${order.statut === 'PAYEE' ? 'bg-success/10 text-success border border-success/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                                    {order.statut}
                                </span>
                                <button aria-label="Options de commande" className="btn-icon min-h-[44px] min-w-[44px] border-transparent bg-transparent text-on-surface-variant hover:text-on-background"><MoreVertical className="w-5 h-5" /></button>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="py-16 text-center border border-dashed border-outline rounded-xl bg-surface/50">
                            <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-on-surface-subtle" strokeWidth={1.5} />
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-subtle">Aucune commande enregistrée</p>
                        </div>
                    )}
                 </div>
              </div>
 
              {/* Reservations */}
              <div className="space-y-8">
                 <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end border-b border-outline/50 pb-5">
                    <div>
                        <span className="text-[9px] font-bold text-accent tracking-[0.25em] uppercase block mb-1">Réservations</span>
                        <h2 className="text-2xl font-bold text-on-background tracking-tight lowercase font-heading">Tables réservées.</h2>
                    </div>
                    <Link to="/reservations" className="min-h-11 inline-flex items-center self-start text-[10px] font-bold text-on-background hover:text-accent transition-colors uppercase tracking-[0.2em] border-b border-outline">Réserver une table</Link>
                 </div>
 
                 <div className="space-y-4">
                    {reservations.length > 0 ? reservations.map((res, idx) => (
                        <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 sm:p-5 bg-surface border border-outline rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-accent/30 transition-all duration-300 shadow-premium"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center text-accent border border-outline">
                                    <Calendar className="w-5 h-5" strokeWidth={2} />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold tracking-tight text-on-background">{new Date(res.date_reservation).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}</h4>
                                    <p className="text-xs text-on-surface-muted mt-0.5">Arrivée à {res.heure_debut} • Table {res.table} ({res.nombre_personnes} pers)</p>
                                </div>
                            </div>
                            <span className="bg-surface-container-high border border-outline px-3.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-on-surface-subtle">{res.statut}</span>
                        </motion.div>
                    )) : (
                        <div className="py-16 text-center border border-dashed border-outline rounded-xl bg-surface/50">
                            <Calendar className="w-10 h-10 mx-auto mb-3 text-on-surface-subtle" strokeWidth={1.5} />
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-subtle">Aucune table réservée</p>
                        </div>
                    )}
                 </div>
              </div>
           </div>
 
           {/* Quick Actions & Support */}
           <div className="lg:col-span-4 space-y-8">
              <div className="bg-[#1E1111] text-white rounded-2xl p-6 md:p-8 space-y-8 shadow-premium-lg relative overflow-hidden border border-white/5">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-[50px] -mr-24 -mt-24 pointer-events-none" />
                 
                 <div className="space-y-2 relative z-10">
                    <span className="text-[9px] font-bold tracking-[0.25em] text-amber-400 uppercase">Assistance</span>
                    <h3 className="text-xl font-bold tracking-tight text-white m-0">Menu Membre.</h3>
                 </div>
 
                 <div className="space-y-1 relative z-10">
                    {[
                       { icon: Settings, label: 'Paramètres du Profil', action: () => {} },
                       { icon: MessageCircle, label: 'Donner votre avis', action: () => setIsReviewModalOpen(true), highlight: hasPaidOrders }
                    ].map((item, i) => (
                       <button
                        key={i} onClick={item.action}
                        disabled={item.highlight === false}
                        className={`w-full min-h-[44px] flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 group ${item.highlight === false ? 'opacity-35 cursor-not-allowed' : 'hover:bg-white/5 text-white/90 hover:text-white'}`}
                       >
                          <div className="flex items-center gap-3">
                             <item.icon className="w-4 h-4 text-amber-400" strokeWidth={2} />
                             <span className="text-xs font-semibold tracking-wider uppercase">{item.label}</span>
                          </div>
                          {item.highlight !== false && <ChevronRight className="w-4 h-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:translate-x-0.5 transition-all" />}
                       </button>
                    ))}
                 </div>
 
                 <div className="pt-6 border-t border-white/10 relative z-10">
                    <button onClick={() => logout()} className="w-full min-h-[44px] flex items-center gap-3 text-white/90 p-2.5 rounded-xl hover:bg-white/10 hover:text-white transition-all font-semibold text-xs tracking-wider uppercase">
                       <LogOut className="w-4 h-4 text-amber-400" strokeWidth={2} />
                       <span>Fermer la session</span>
                    </button>
                 </div>
              </div>
 
              {!hasPaidOrders && (
                <div className="p-5 bg-accent/5 border border-accent/20 rounded-xl flex items-center gap-4">
                    <CheckCircle2 className="w-8 h-8 text-accent shrink-0" strokeWidth={1.5} />
                    <p className="text-xs text-on-surface-muted leading-relaxed">
                        Le partage d'avis est réservé à nos convives ayant déjà réglé une commande au restaurant.
                    </p>
                </div>
              )}
           </div>
        </section>
 
        {/* Unified Review Modal */}
        <AnimatePresence>
        {isReviewModalOpen && hasPaidOrders && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/95 backdrop-blur-md" onClick={() => setIsReviewModalOpen(false)} />
            <motion.div role="dialog" aria-modal="true" aria-labelledby="review-dialog-title" initial={{ opacity: 0, scale: 0.96, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 15 }} className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto custom-scrollbar bg-surface border border-outline rounded-xl p-6 sm:p-8 md:p-10 shadow-premium-lg flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center text-accent mb-8 border border-outline">
                    <Quote className="w-6 h-6" strokeWidth={2} />
                 </div>
                 <h3 id="review-dialog-title" className="text-2xl font-bold text-on-background tracking-tight mb-2 lowercase font-heading">donner votre avis.</h3>
                 <p className="text-on-surface-muted text-xs mb-8">Partagez votre avis sur les plats dégustés lors de votre repas.</p>
                 
                 <form onSubmit={handleReviewSubmit} noValidate className="w-full space-y-5">
                    <label htmlFor="review-comment" className="sr-only">Votre avis</label>
                    <textarea 
                        id="review-comment"
                        required
                        value={comment}
                        onChange={(e) => {
                            setComment(e.target.value);
                            if (reviewError) setReviewError('');
                        }}
                        aria-invalid={Boolean(reviewError)}
                        aria-describedby={reviewError ? 'review-comment-error' : undefined}
                        className="field-control w-full p-4 rounded-xl text-sm resize-none h-40 placeholder:text-on-surface-subtle"
                        placeholder="Écrivez ici (minimum 10 caractères)..."
                    />
                    {reviewError && (
                        <p id="review-comment-error" role="alert" className="form-error text-left text-xs">
                            {reviewError}
                        </p>
                    )}
 
                    <button disabled={isSubmitting} type="submit" className="btn-primary w-full h-12 shadow-sm flex items-center justify-center">
                       {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin text-on-primary" /> : <span>Transmettre mon avis</span>}
                    </button>
                 </form>
            </motion.div>
          </div>
        )}
        </AnimatePresence>
 
      </main>
    </div>
  );
};
