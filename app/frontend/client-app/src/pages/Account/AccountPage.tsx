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
    <div className="page-shell">
      <main className="max-w-7xl mx-auto px-client-margin page-section space-y-16 md:space-y-24">
        
        {/* Profile Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 bg-surface border border-outline rounded-lg p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-10 relative overflow-hidden shadow-sm group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
              
              <div className="w-32 h-32 rounded-full border-4 border-outline-variant bg-surface-container-highest flex items-center justify-center overflow-hidden shrink-0 shadow-2xl relative">
                 <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=300" className="w-full h-full object-cover grayscale-[0.3]" alt="Avatar" loading="lazy" decoding="async" />
              </div>

              <div className="flex-1 text-center md:text-left space-y-6 z-10">
                 <div>
                    <h1 className="text-4xl md:text-6xl font-black text-on-background uppercase tracking-tight m-0 leading-none break-words">{username}</h1>
                    <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-widest mt-4">Compte client</p>
                 </div>
                 
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <div className="bg-surface-container-high border border-outline px-4 py-2 rounded-lg flex items-center gap-3">
                       <Award className="w-4 h-4 text-on-background" />
                       <span className="font-sans text-[10px] font-black text-on-background uppercase tracking-widest">{loyalty?.tier_display || 'OR'}</span>
                    </div>
                    <div className="bg-surface-container-high border border-outline px-4 py-2 rounded-lg flex items-center gap-3">
                       <ShieldCheck className="w-4 h-4 text-success" />
                       <span className="font-sans text-[10px] font-black text-on-background uppercase tracking-widest">{loyalty?.points || 0} points</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Tier Progress Bento */}
           <div className="lg:col-span-4 bg-surface border border-outline rounded-lg p-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-6">
                 <h3 className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Points fidélité</h3>
                 <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <motion.div
                       initial={{ width: 0 }}
                       whileInView={{ width: '65%' }}
                       viewport={{ once: true }}
                       transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                       className="h-full bg-on-background"
                    />
                 </div>
                 <p className="text-lg text-on-background">Vous vous rapprochez du prochain avantage.</p>
              </div>
           </div>
        </section>

        {/* Privileges & Rewards Section */}
        <section className="space-y-12">
            <div className="flex justify-between items-end border-b border-outline pb-6">
                <div>
                    <h2 className="text-4xl font-black text-on-background tracking-tight m-0">Avantages</h2>
                    <p className="font-sans text-[10px] font-black text-on-surface-variant tracking-widest mt-2">Utilisez vos points disponibles</p>
                </div>
                <div className="flex items-center gap-3 text-on-surface-variant">
                    <Zap className="w-4 h-4 fill-current" />
                    <span className="font-sans text-[10px] font-black tracking-widest">Compte fidélité</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {rewards.map((reward, idx) => {
                    const isUnlockable = (loyalty?.points || 0) >= reward.points_requis;
                    return (
                        <motion.div 
                            key={reward.id}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-6 md:p-8 rounded-lg border transition-all duration-300 flex flex-col justify-between min-h-[260px] ${isUnlockable ? 'bg-surface border-outline shadow-sm hover:border-on-background/20' : 'bg-surface-container-high border-transparent grayscale'}`}
                        >
                            <div className="space-y-6">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isUnlockable ? 'bg-surface-container-high text-on-background' : 'bg-surface-container-high text-on-surface-subtle'}`}>
                                    <Gift className="w-5 h-5" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-black text-on-background uppercase">{reward.nom}</h4>
                                    <p className="font-body text-xs text-on-surface-variant leading-relaxed">{reward.description}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-t border-outline pt-6">
                                <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{reward.points_requis} pts</span>
                                {isUnlockable ? (
                                    <button className="min-h-11 px-3 -mr-3 text-on-background font-sans text-[10px] font-black uppercase tracking-widest flex items-center gap-1 rounded-md hover:bg-surface-container-high hover:translate-x-1 transition-all">En profiter <ChevronRight className="w-3 h-3" /></button>
                                ) : (
                                    <span className="font-sans text-[10px] font-black text-on-surface-subtle uppercase tracking-widest">Verrouillé</span>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16">
           {/* Active Reservations & History */}
           <div className="lg:col-span-8 space-y-20">
              
              {/* Recent Orders */}
              <div className="space-y-10">
                 <div className="flex justify-between items-end border-b border-outline pb-6">
                    <div>
                        <h2 className="text-4xl font-black text-on-background uppercase tracking-tight m-0">Historique</h2>
                        <p className="font-sans text-[10px] font-black text-on-surface-variant tracking-widest mt-2">Commandes passées</p>
                    </div>
                    <div className="flex items-center gap-3 text-on-surface-variant">
                        <History className="w-4 h-4" />
                        <span className="font-sans text-[10px] font-black tracking-widest">Historique client</span>
                    </div>
                 </div>

                 <div className="space-y-6">
                    {orders.length > 0 ? orders.map((order, idx) => (
                        <motion.div 
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-6 md:p-8 bg-surface border border-outline rounded-lg flex flex-col sm:flex-row items-center justify-between gap-6 md:gap-8 hover:border-on-background/20 transition-all group shadow-sm"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-surface-container-high rounded-lg flex items-center justify-center text-on-background border border-outline group-hover:bg-on-background group-hover:text-background transition-all duration-500">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-on-background uppercase tracking-tight">Commande #{order.id}</h4>
                                    <p className="font-body text-sm text-on-surface-variant">
                                        {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} • {order.montant_total} DH
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className={`px-4 py-1.5 rounded-full font-sans text-[9px] font-black uppercase tracking-widest ${order.statut === 'PAYEE' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                                    {order.statut}
                                </span>
                                <button aria-label="Options de commande" className="btn-icon border-transparent bg-transparent text-on-surface-variant hover:text-on-background"><MoreVertical className="w-5 h-5" /></button>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="py-20 text-center opacity-20">
                            <ShoppingBag className="w-12 h-12 mx-auto mb-4" strokeWidth={1} />
                            <p className="font-sans text-[10px] font-black uppercase tracking-[0.4em]">Aucune commande enregistrée</p>
                        </div>
                    )}
                 </div>
              </div>

              {/* Reservations */}
              <div className="space-y-10">
                 <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end border-b border-outline pb-6">
                    <h2 className="text-4xl font-black text-on-background uppercase tracking-tight m-0">Réservations</h2>
                    <Link to="/reservations" className="min-h-11 inline-flex items-center self-start font-sans text-[10px] font-black text-on-background hover:text-on-surface-variant transition-colors uppercase tracking-[0.2em] border-b border-outline">Réserver une table</Link>
                 </div>

                 <div className="space-y-6">
                    {reservations.length > 0 ? reservations.map((res, idx) => (
                        <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-6 md:p-8 bg-surface border border-outline rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-on-background/20 transition-all shadow-sm"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-surface-container-high rounded-lg flex items-center justify-center text-on-background border border-outline">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-on-background uppercase tracking-tight">{res.date_reservation}</h4>
                                    <p className="font-body text-sm text-on-surface-variant">{res.heure_debut} • Table {res.table}</p>
                                </div>
                            </div>
                            <span className="bg-surface-container-high border border-outline px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{res.statut}</span>
                        </motion.div>
                    )) : (
                        <div className="py-20 text-center opacity-20">
                            <Calendar className="w-12 h-12 mx-auto mb-4" strokeWidth={1} />
                            <p className="font-sans text-[10px] font-black uppercase tracking-[0.5em]">Aucune table réservée</p>
                        </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Quick Actions & Support */}
           <div className="lg:col-span-4 space-y-10">
              <div className="bg-on-background text-background rounded-lg p-8 md:p-10 space-y-10 shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-[60px] -mr-24 -mt-24 pointer-events-none" />
                 
                 <div className="space-y-4 relative z-10">
                    <h3 className="text-3xl text-background tracking-tight m-0">Menu privé</h3>
                    <p className="font-sans text-[10px] font-black tracking-[0.2em] text-background/70">Compte et assistance</p>
                 </div>

                 <div className="space-y-2 relative z-10">
                    {[
                       { icon: Settings, label: 'Paramètres du Profil', action: () => {} },
                       { icon: MessageCircle, label: 'Donner votre avis', action: () => setIsReviewModalOpen(true), highlight: hasPaidOrders }
                    ].map((item, i) => (
                       <button
                        key={i} onClick={item.action}
                        disabled={item.highlight === false}
                        className={`w-full min-h-12 flex items-center justify-between p-3 rounded-2xl transition-all group ${item.highlight === false ? 'opacity-45 cursor-not-allowed' : 'hover:bg-white/5'}`}
                       >
                          <div className="flex items-center gap-4">
                             <item.icon className={`w-4 h-4 ${item.highlight ? 'text-background' : ''}`} />
                             <span className="font-sans text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
                          </div>
                          {item.highlight !== false && <ChevronRight className="w-4 h-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:translate-x-1 transition-all" />}
                       </button>
                    ))}
                 </div>

                 <div className="pt-10 border-t border-white/5 relative z-10">
                    <button onClick={() => logout()} className="w-full min-h-12 flex items-center gap-4 text-background p-3 rounded-2xl hover:bg-white/10 transition-all font-sans text-[11px] font-black uppercase tracking-widest">
                       <LogOut className="w-4 h-4" />
                       Fermer la session
                    </button>
                 </div>
              </div>

              {!hasPaidOrders && (
                <div className="p-6 bg-error/5 border border-error/20 rounded-lg flex items-center gap-5">
                    <CheckCircle2 className="w-8 h-8 text-error shrink-0" strokeWidth={1} />
                    <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                        Le partage d'avis est réservé à nos convives ayant déjà réglé une commande.
                    </p>
                </div>
              )}
           </div>
        </section>

        {/* Unified Review Modal */}
        <AnimatePresence>
        {isReviewModalOpen && hasPaidOrders && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={() => setIsReviewModalOpen(false)} />
            <motion.div role="dialog" aria-modal="true" aria-labelledby="review-dialog-title" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto custom-scrollbar bg-surface border border-outline rounded-lg p-8 md:p-12 shadow-2xl flex flex-col items-center text-center">
                 <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center text-on-background mb-10 border border-outline">
                    <Quote className="w-8 h-8" />
                 </div>
                 <h3 id="review-dialog-title" className="text-3xl md:text-5xl font-black text-on-background tracking-tight mb-4">Donner votre avis</h3>
                 <p className="text-on-surface-variant font-body mb-12">Dites-nous comment s'est passée votre dernière commande.</p>
                 
                 <form onSubmit={handleReviewSubmit} noValidate className="w-full space-y-6">
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
                        className="field-control w-full p-6 md:p-8 rounded-lg text-lg md:text-2xl resize-none h-48 placeholder:text-on-surface-variant"
                        placeholder="Écrivez ici..."
                    />
                    {reviewError && (
                        <p id="review-comment-error" role="alert" className="form-error text-left">
                            {reviewError}
                        </p>
                    )}

                    <button disabled={isSubmitting} type="submit" className="btn-primary w-full min-h-14 gap-4">
                       {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Transmettre mon avis</span>}
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
