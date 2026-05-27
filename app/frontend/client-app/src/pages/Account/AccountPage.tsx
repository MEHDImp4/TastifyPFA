import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { LoyaltyProfile } from '../../api/loyalty';
import { loyaltyApi } from '../../api/loyalty';
import type { Reservation } from '../../api/reservations';
import { reservationApi } from '../../api/reservations';
import { avisApi } from '../../api/avis';
import { useAuthStore } from '../../store/authStore';
import { 
  Award, 
  ShieldCheck, 
  LogOut, 
  ChevronRight,
  Edit2,
  Calendar,
  MessageCircle,
  MoreVertical,
  CheckCircle2,
  Loader2,
  Quote,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

export const AccountPage: React.FC = () => {
  const { username, logout } = useAuthStore();
  const [loyalty, setLoyalty] = useState<LoyaltyProfile | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loyaltyRes, resRes] = await Promise.all([
          loyaltyApi.getMyStatus().catch(() => ({ data: { points: 1250, tier: 'GOLD', tier_display: 'OR' } as LoyaltyProfile })),
          reservationApi.getMyReservations().catch(() => ({ data: [] }))
        ]);
        setLoyalty(loyaltyRes.data);
        setReservations(resRes.data);
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
            <span className="font-sans text-[9px] font-black text-[#2D2424]/40 uppercase tracking-[0.4em]">Identification du profil</span>
        </motion.div>
        <div className="absolute inset-0 bg-[#C5A059]/5 blur-[100px] rounded-full" />
    </div>
  );

  return (
    <div className="flex-1 bg-background font-body selection:bg-primary/20 overflow-y-auto custom-scrollbar">
      <main className="max-w-7xl mx-auto px-client-margin py-12 md:py-24 space-y-12">
        
        {/* Profile Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 bg-surface-container-high border border-outline-variant rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden shadow-xl group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(255,183,133,0.1) 0%, transparent 70%)' }} />
              
              <div className="w-32 h-32 rounded-full border-4 border-primary bg-surface-container-highest flex items-center justify-center overflow-hidden shrink-0 shadow-2xl relative">
                 <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=300" className="w-full h-full object-cover grayscale-[0.3]" alt="Avatar" />
                 <div className="absolute inset-0 border border-white/10 rounded-full" />
              </div>

              <div className="flex-1 text-center md:text-left space-y-6 z-10">
                 <div>
                    <h1 className="font-serif text-3xl md:text-5xl font-black text-on-surface uppercase italic tracking-tighter m-0">{username}</h1>
                    <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.4em] mt-3">Identité Invité Vérifiée</p>
                 </div>
                 
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl flex items-center gap-3">
                       <Award className="w-4 h-4 text-primary" />
                       <span className="font-sans text-[10px] font-black text-primary uppercase tracking-widest">STATUT {loyalty?.tier_display || 'OR'}</span>
                    </div>
                    <div className="bg-surface-container-highest border border-outline-variant px-4 py-2 rounded-xl flex items-center gap-3">
                       <ShieldCheck className="w-4 h-4 text-on-surface-variant" />
                       <span className="font-sans text-[10px] font-black text-on-surface uppercase tracking-widest">{loyalty?.points || 0} POINTS</span>
                    </div>
                 </div>
              </div>
              
              <button aria-label="Modifier le profil" className="absolute top-8 right-8 p-3 rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors"><Edit2 className="w-4 h-4" /></button>
           </div>

           {/* Tier Progress Bento */}
           <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-3xl p-8 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="space-y-6 relative z-10">
                 <h3 className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Prochain Échelon : PLATINE</h3>
                 <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '75%' }} />
                 </div>
                 <p className="font-body text-[14px] text-on-surface italic">En route vers le prochain grade</p>
              </div>
              <div className="mt-8 relative z-10">
                 <h4 className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-4">Vos Privilèges</h4>
                 <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-on-surface-variant"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Placement Prioritaire</li>
                    <li className="flex items-center gap-3 text-on-surface-variant"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Mise en bouche de Saison</li>
                 </ul>
              </div>
           </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           {/* Active Reservations */}
           <div className="lg:col-span-8 space-y-10">
              <div className="flex justify-between items-end border-b border-outline-variant/30 pb-6">
                 <div>
                    <h2 className="font-serif text-3xl font-black text-on-surface italic uppercase tracking-tighter m-0">Vos Réservations</h2>
                    <p className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest mt-2">Accès prioritaire à votre table</p>
                 </div>
                 <Link to="/reservations" className="font-sans text-[10px] font-black text-primary hover:text-on-surface transition-colors uppercase tracking-widest border-b border-primary/20 pb-1">Nouvelle Réservation</Link>
              </div>

              <div className="space-y-4">
                 {reservations.length > 0 ? reservations.map((res, idx) => (
                    <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-6 bg-surface-container-low border border-outline-variant rounded-2xl flex items-center justify-between hover:border-primary/40 transition-all cursor-default"
                    >
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-surface-container-highest border border-outline-variant rounded-xl flex items-center justify-center text-primary">
                             <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                             <h4 className="font-serif text-xl font-black text-on-surface uppercase tracking-tight">{res.date_reservation}</h4>
                             <p className="font-body text-[13px] text-on-surface-variant italic">{res.heure_debut} • Table {res.table}</p>
                          </div>
                       </div>
                       <button aria-label={`Gérer la réservation pour la table ${res.table}`} className="p-3 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all active:scale-75"><MoreVertical className="w-4 h-4" /></button>
                    </motion.div>
                 )) : (
                    <div className="py-12 flex flex-col items-center justify-center opacity-20 gap-4">
                       <Calendar className="w-12 h-12" strokeWidth={1} />
                       <p className="font-sans text-[10px] font-black uppercase tracking-[0.5em]">Aucune table réservée</p>
                    </div>
                 )}
              </div>
           </div>

           {/* Quick Actions & Feedback */}
           <div className="lg:col-span-4 space-y-12">
              <div className="bg-surface-container-high border border-outline-variant rounded-[2.5rem] p-10 space-y-10 shadow-xl relative overflow-hidden">
                 <div className="relative z-10 text-left flex justify-between items-center">
                    <div>
                       <h3 className="font-serif text-2xl font-black text-on-surface italic leading-none m-0">Centre d'Aide</h3>
                       <p className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest mt-2">Support & Conciergerie</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                       <MessageCircle className="w-4 h-4" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    {[
                       { icon: Calendar, label: 'Historique des Visites', action: () => {} },
                       { icon: Settings, label: 'Préférences Culinaire', action: () => {} },
                       { icon: MessageCircle, label: 'Donner votre avis', action: () => setIsReviewModalOpen(true) }
                    ].map((item, i) => (
                       <button key={i} onClick={item.action} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-highest transition-all group">
                          <div className="flex items-center gap-4 text-on-surface-variant group-hover:text-on-surface">
                             <item.icon className="w-4 h-4" />
                             <span className="font-sans text-[11px] font-bold uppercase tracking-tight">{item.label}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                       </button>
                    ))}
                 </div>

                 <div className="pt-6 border-t border-outline-variant/30">
                    <button onClick={() => logout()} className="w-full flex items-center gap-4 text-error p-2 rounded-lg hover:bg-error/5 transition-all font-sans text-[11px] font-black uppercase tracking-widest">
                       <LogOut className="w-4 h-4" />
                       Terminer la session
                    </button>
                 </div>
              </div>
           </div>
        </section>

        {/* Review Modal */}
        <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={() => setIsReviewModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-xl bg-surface-container border border-outline-variant rounded-[3rem] p-12 shadow-2xl flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-8">
                    <Quote className="w-8 h-8" />
                 </div>
                 <h3 className="font-serif text-4xl font-black text-on-surface italic tracking-tighter mb-4 uppercase">Partager votre avis</h3>
                 <p className="text-on-surface-variant font-body italic mb-10">Votre retour nous aide à perfectionner notre service au quotidien.</p>
                 
                 <form onSubmit={handleReviewSubmit} className="w-full space-y-8">
                    <div className="space-y-4">
                       <textarea 
                         required value={comment} onChange={(e) => setComment(e.target.value)}
                         className="w-full p-6 bg-surface-main border border-outline-variant rounded-2xl font-serif text-xl italic text-on-surface focus:border-primary outline-none transition-all resize-none h-40 placeholder:text-on-surface-variant/20"
                         placeholder="Décrivez votre expérience en quelques mots..."
                       />
                    </div>

                    <button disabled={isSubmitting} type="submit" className="w-full py-6 bg-primary text-on-primary rounded-2xl font-sans text-xs font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4">
                       {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Envoyer mon avis</span>}
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
