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

export const AccountPage: React.FC = () => {
  const { username, logout } = useAuthStore();
  const [loyalty, setLoyalty] = useState<LoyaltyProfile | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const hasPaidOrders = orders.some(o => o.statut === 'PAYEE');

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPaidOrders) {
        toast.error("Vous devez avoir réglé une commande pour donner votre avis.");
        return;
    }
    setIsSubmitting(true);
    try {
        await avisApi.createAvis({ commentaire: comment, note: 5 });
        toast.success('Avis enregistré');
        setIsReviewModalOpen(false);
        setComment('');
    } catch (err) {
        toast.error('Échec de l\'envoi');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#FAF9F6] relative overflow-hidden">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6 relative z-10"
        >
            <Loader2 className="w-12 h-12 animate-spin text-[#D14D1A]" strokeWidth={1.5}/>
            <span className="font-sans text-[9px] font-black text-[#2D2424]/40 uppercase tracking-[0.4em]">Chargement de votre univers</span>
        </motion.div>
        <div className="absolute inset-0 bg-[#C5A059]/5 blur-[100px] rounded-full" />
    </div>
  );

  return (
    <div className="flex-1 bg-background font-body selection:bg-primary/20 overflow-y-auto custom-scrollbar">
      <main className="max-w-7xl mx-auto px-client-margin py-12 md:py-24 space-y-24">
        
        {/* Profile Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 bg-white border border-[#2D2424]/5 rounded-[3rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden shadow-xl group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
              
              <div className="w-32 h-32 rounded-full border-4 border-[#D14D1A] bg-surface-container-highest flex items-center justify-center overflow-hidden shrink-0 shadow-2xl relative">
                 <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=300" className="w-full h-full object-cover grayscale-[0.3]" alt="Avatar" />
              </div>

              <div className="flex-1 text-center md:text-left space-y-6 z-10">
                 <div>
                    <h1 className="font-serif text-4xl md:text-6xl font-black text-[#2D2424] uppercase  tracking-tighter m-0 leading-none">{username}</h1>
                    <p className="font-sans text-[11px] font-black text-[#2D2424]/40 uppercase tracking-[0.4em] mt-4">Identité Vérifiée</p>
                 </div>
                 
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <div className="bg-[#D14D1A]/5 border border-[#D14D1A]/10 px-4 py-2 rounded-xl flex items-center gap-3">
                       <Award className="w-4 h-4 text-[#D14D1A]" />
                       <span className="font-sans text-[10px] font-black text-[#D14D1A] uppercase tracking-widest">{loyalty?.tier_display || 'OR'}</span>
                    </div>
                    <div className="bg-[#FAF9F6] border border-[#2D2424]/5 px-4 py-2 rounded-xl flex items-center gap-3">
                       <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                       <span className="font-sans text-[10px] font-black text-[#2D2424] uppercase tracking-widest">{loyalty?.points || 0} POINTS</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Tier Progress Bento */}
           <div className="lg:col-span-4 bg-white border border-[#2D2424]/5 rounded-[3rem] p-10 flex flex-col justify-between shadow-lg">
              <div className="space-y-6">
                 <h3 className="font-sans text-[11px] font-black text-[#2D2424]/30 uppercase tracking-[0.2em]">STATUT PRIVILÈGE</h3>
                 <div className="w-full h-2 bg-[#FAF9F6] rounded-full overflow-hidden">
                    <motion.div
                       initial={{ width: 0 }}
                       whileInView={{ width: '65%' }}
                       viewport={{ once: true }}
                       transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                       className="h-full bg-gradient-to-r from-[#C5A059] to-[#D14D1A] shadow-[0_0_12px_rgba(209,77,26,0.2)]"
                    />
                 </div>
                 <p className="font-serif text-lg text-[#2D2424] ">Bientôt le prochain échelon culinaire</p>
              </div>
           </div>
        </section>

        {/* Privileges & Rewards Section */}
        <section className="space-y-12">
            <div className="flex justify-between items-end border-b border-[#2D2424]/10 pb-6">
                <div>
                    <h2 className="font-serif text-4xl font-black text-[#2D2424]  uppercase tracking-tighter m-0">Privilèges</h2>
                    <p className="font-sans text-[10px] font-black text-[#2D2424]/30 uppercase tracking-widest mt-2">Profitez de vos points cumulés</p>
                </div>
                <div className="flex items-center gap-3 text-[#C5A059]">
                    <Zap className="w-4 h-4 fill-current" />
                    <span className="font-sans text-[10px] font-black uppercase tracking-widest">Offres Membres</span>
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
                            className={`p-8 rounded-[2.5rem] border transition-all duration-700 flex flex-col justify-between min-h-[300px] ${isUnlockable ? 'bg-white border-[#2D2424]/5 shadow-xl hover:border-[#C5A059]/30' : 'bg-[#F4F1EA]/50 border-transparent grayscale'}`}
                        >
                            <div className="space-y-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isUnlockable ? 'bg-[#C5A059]/10 text-[#C5A059]' : 'bg-[#2D2424]/5 text-[#2D2424]/20'}`}>
                                    <Gift className="w-5 h-5" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-serif text-xl font-black text-[#2D2424] uppercase ">{reward.nom}</h4>
                                    <p className="font-body text-xs text-[#2D2424]/60  leading-relaxed">{reward.description}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-t border-[#2D2424]/5 pt-6">
                                <span className="font-sans text-[10px] font-black text-[#C5A059] uppercase tracking-widest">{reward.points_requis} PTS</span>
                                {isUnlockable ? (
                                    <button className="text-[#D14D1A] font-sans text-[9px] font-black uppercase tracking-widest flex items-center gap-1 hover:translate-x-1 transition-all">En profiter <ChevronRight className="w-3 h-3" /></button>
                                ) : (
                                    <span className="font-sans text-[9px] font-black text-[#2D2424]/20 uppercase tracking-widest">Verrouillé</span>
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
                 <div className="flex justify-between items-end border-b border-[#2D2424]/10 pb-6">
                    <div>
                        <h2 className="font-serif text-4xl font-black text-[#2D2424]  uppercase tracking-tighter m-0">Historique</h2>
                        <p className="font-sans text-[10px] font-black text-[#2D2424]/30 uppercase tracking-widest mt-2">Vos moments partagés avec nous</p>
                    </div>
                    <div className="flex items-center gap-3 text-[#D14D1A]">
                        <History className="w-4 h-4" />
                        <span className="font-sans text-[10px] font-black uppercase tracking-widest">Suivi d'Expérience</span>
                    </div>
                 </div>

                 <div className="space-y-6">
                    {orders.length > 0 ? orders.map((order, idx) => (
                        <motion.div 
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-8 bg-white border border-[#2D2424]/5 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-8 hover:border-[#D14D1A]/20 transition-all group shadow-sm"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-[#FAF9F6] rounded-2xl flex items-center justify-center text-[#D14D1A] border border-[#2D2424]/5 group-hover:bg-[#D14D1A] group-hover:text-white transition-all duration-500">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-serif text-2xl font-black text-[#2D2424] uppercase  tracking-tight">Commande #{order.id}</h4>
                                    <p className="font-body text-sm text-[#2D2424]/60 ">
                                        {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} • {order.montant_total} DH
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className={`px-4 py-1.5 rounded-full font-sans text-[9px] font-black uppercase tracking-widest ${order.statut === 'PAYEE' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                                    {order.statut}
                                </span>
                                <button className="p-2 text-[#2D2424]/20 hover:text-[#2D2424] transition-all"><MoreVertical className="w-5 h-5" /></button>
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
                 <div className="flex justify-between items-end border-b border-[#2D2424]/10 pb-6">
                    <h2 className="font-serif text-4xl font-black text-[#2D2424]  uppercase tracking-tighter m-0">Réservations</h2>
                    <Link to="/reservations" className="font-sans text-[10px] font-black text-[#D14D1A] hover:text-[#2D2424] transition-colors uppercase tracking-[0.2em] border-b border-[#D14D1A]/20 pb-1">Réserver une table</Link>
                 </div>

                 <div className="space-y-6">
                    {reservations.length > 0 ? reservations.map((res, idx) => (
                        <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-8 bg-white border border-[#2D2424]/5 rounded-[2rem] flex items-center justify-between hover:border-[#C5A059]/30 transition-all shadow-sm"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-[#FAF9F6] rounded-2xl flex items-center justify-center text-[#C5A059] border border-[#2D2424]/5">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-serif text-2xl font-black text-[#2D2424] uppercase  tracking-tight">{res.date_reservation}</h4>
                                    <p className="font-body text-sm text-[#2D2424]/60 ">{res.heure_debut} • Table {res.table}</p>
                                </div>
                            </div>
                            <span className="bg-[#FAF9F6] border border-[#2D2424]/5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#2D2424]/40">{res.statut}</span>
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
              <div className="bg-[#2D2424] text-[#FAF9F6] rounded-[3rem] p-10 space-y-12 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-[60px] -mr-24 -mt-24 pointer-events-none" />
                 
                 <div className="space-y-4 relative z-10">
                    <h3 className="font-serif text-3xl  tracking-tight m-0">Menu Privé</h3>
                    <p className="font-sans text-[9px] font-black uppercase tracking-[0.3em] text-[#FAF9F6]/40">Gestion du compte & Assistance</p>
                 </div>

                 <div className="space-y-2 relative z-10">
                    {[
                       { icon: Settings, label: 'Paramètres du Profil', action: () => {} },
                       { icon: MessageCircle, label: 'Donner votre avis', action: () => setIsReviewModalOpen(true), highlight: hasPaidOrders }
                    ].map((item, i) => (
                       <button 
                        key={i} onClick={item.action} 
                        className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all group ${item.highlight === false ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/5'}`}
                       >
                          <div className="flex items-center gap-4">
                             <item.icon className={`w-4 h-4 ${item.highlight ? 'text-[#D14D1A]' : ''}`} />
                             <span className="font-sans text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
                          </div>
                          {item.highlight !== false && <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
                       </button>
                    ))}
                 </div>

                 <div className="pt-10 border-t border-white/5 relative z-10">
                    <button onClick={() => logout()} className="w-full flex items-center gap-4 text-[#D14D1A] p-3 rounded-2xl hover:bg-[#D14D1A]/5 transition-all font-sans text-[11px] font-black uppercase tracking-[0.4em]">
                       <LogOut className="w-4 h-4" />
                       Fermer la session
                    </button>
                 </div>
              </div>

              {!hasPaidOrders && (
                <div className="p-8 bg-[#D14D1A]/5 border border-[#D14D1A]/20 rounded-[2.5rem] flex items-center gap-5">
                    <CheckCircle2 className="w-8 h-8 text-[#D14D1A] shrink-0" strokeWidth={1} />
                    <p className="font-body text-xs text-[#2D2424]/70  leading-relaxed">
                        Le partage d'avis est réservé à nos convives ayant déjà réglé une commande.
                    </p>
                </div>
              )}
           </div>
        </section>

        {/* Unified Review Modal */}
        <AnimatePresence>
        {isReviewModalOpen && hasPaidOrders && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#FAF9F6]/95 backdrop-blur-xl" onClick={() => setIsReviewModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-xl bg-white border border-[#2D2424]/5 rounded-[4rem] p-12 md:p-20 shadow-2xl flex flex-col items-center text-center">
                 <div className="w-20 h-20 bg-[#D14D1A]/5 rounded-full flex items-center justify-center text-[#D14D1A] mb-10 border border-[#D14D1A]/10">
                    <Quote className="w-8 h-8" />
                 </div>
                 <h3 className="font-serif text-5xl font-black text-[#2D2424]  tracking-tighter mb-4">Votre avis nous est précieux.</h3>
                 <p className="text-[#2D2424]/60 font-body  mb-12">Partagez votre ressenti sur votre dernier moment chez nous.</p>
                 
                 <form onSubmit={handleReviewSubmit} className="w-full space-y-10">
                    <textarea 
                        required value={comment} onChange={(e) => setComment(e.target.value)}
                        className="w-full p-8 bg-[#FAF9F6] border border-[#2D2424]/10 rounded-3xl font-serif text-2xl  text-[#2D2424] focus:border-[#D14D1A]/30 outline-none transition-all resize-none h-48 placeholder:text-[#2D2424]/10"
                        placeholder="Écrivez ici..."
                    />

                    <button disabled={isSubmitting} type="submit" className="w-full py-7 bg-[#2D2424] text-[#FAF9F6] rounded-3xl font-sans text-xs font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-[#D14D1A] transition-all flex items-center justify-center gap-4">
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
