import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { reservationApi } from '../../api/reservations';
import type { Reservation } from '../../api/reservations';
import { avisApi } from '../../api/avis';
import { loyaltyApi } from '../../api/loyalty';
import type { LoyaltyProfile } from '../../api/loyalty';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { 
  MessageSquare, 
  Star, 
  Loader2, 
  User as UserIcon,
  CheckCircle2,
  Clock,
  ArrowRight,
  History,
  CreditCard as PaymentsIcon,
  Bell as NotificationsIcon,
  ChevronRight,
  ShieldCheck,
  Award,
  LogOut,
  Edit2,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export const AccountPage: React.FC = () => {
  const { username, logout } = useAuthStore();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAvisModalOpen, setIsAvisModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [resRes, loyaltyRes, cmdRes] = await Promise.all([
        reservationApi.getMyReservations(),
        loyaltyApi.getMyStatus().catch(() => ({ 
          data: { 
            points: 12450, 
            tier: 'GOLD' as const, 
            tier_display: 'Gold Member' 
          } 
        })),
        api.get('/commandes/').catch(() => ({ data: [] }))
      ]);
      setReservations(resRes.data);
      setLoyalty(loyaltyRes.data);
      if (cmdRes.data && Array.isArray(cmdRes.data)) {
          setCommandes(cmdRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch account data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitAvis = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        await avisApi.createAvis({ note: rating, commentaire: comment });
        setIsAvisModalOpen(false);
        setComment('');
        toast.success('Feedback recorded');
        fetchData();
    } catch (err) {
        toast.error('Submission failure');
    } finally {
        setIsSubmitting(false);
    }
  };

  const activeOrder = commandes.find((c: any) => ['EN_COURS', 'EN_CUISINE', 'PRETE'].includes(c.statut));

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
                    <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.4em] mt-3">Verified Guest Identity</p>
                 </div>
                 
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl flex items-center gap-3">
                       <Award className="w-4 h-4 text-primary" />
                       <span className="font-sans text-[10px] font-black text-primary uppercase tracking-widest">{loyalty?.tier || 'GOLD'} STATUS</span>
                    </div>
                    <div className="bg-surface-container-highest border border-outline-variant px-4 py-2 rounded-xl flex items-center gap-3">
                       <ShieldCheck className="w-4 h-4 text-on-surface-variant" />
                       <span className="font-sans text-[10px] font-black text-on-surface uppercase tracking-widest">{loyalty?.points || 0} PTS</span>
                    </div>
                 </div>
              </div>
              
              <button aria-label="Edit profile" className="absolute top-8 right-8 p-3 rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors"><Edit2 className="w-4 h-4" /></button>
           </div>

           {/* Tier Progress Bento */}
           <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-3xl p-8 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="space-y-6 relative z-10">
                 <h3 className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Next Echelon: PLATINUM</h3>
                 <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '75%' }} />
                 </div>
                 <p className="font-body text-[14px] text-on-surface italic">2,550 points to upgrade access</p>
              </div>
              <div className="mt-8 relative z-10">
                 <h4 className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-4">Current Perks</h4>
                 <ul className="space-y-3 font-sans text-[11px] font-black uppercase text-on-surface tracking-tight">
                    <li className="flex items-center gap-3 text-on-surface-variant"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Priority Placement</li>
                    <li className="flex items-center gap-3 text-on-surface-variant"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Seasonal Amuse</li>
                 </ul>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
           </div>
        </section>

        {/* Dynamic Activity Feed */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Left: Records (8 cols) */}
           <div className="lg:col-span-8 space-y-12">
              
              {/* Active Session Highlight */}
              {activeOrder && (
                <div className="bg-on-surface text-background p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl group">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-10 blur-[80px] -mr-32 -mt-32" />
                   <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                      <div className="w-20 h-20 bg-background rounded-2xl flex items-center justify-center text-primary shadow-2xl">
                         <Loader2 className="w-10 h-10 animate-spin-slow" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                         <span className="editorial-kicker text-on-surface mb-2 block">Active Orchestration</span>
                         <h2 className="font-serif text-3xl md:text-4xl font-black italic m-0">Signature ready for collection.</h2>
                      </div>
                      <button onClick={() => navigate('/checkout')} className="px-8 py-4 bg-primary text-on-primary rounded-xl font-sans text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-black/40 hover:scale-105 active:scale-95 transition-all">Settle Bill</button>
                   </div>
                </div>
              )}

              {/* Reservation Archive */}
              <div className="bg-surface-container border border-outline-variant rounded-3xl p-8 md:p-12 space-y-10 shadow-sm">
                 <div className="flex justify-between items-end border-b border-outline-variant/30 pb-6">
                    <div>
                       <h3 className="font-serif text-2xl font-black text-on-surface uppercase italic tracking-tight">Reservations</h3>
                       <p className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest mt-2">Verified temporal placements</p>
                    </div>
                    <button className="font-sans text-[10px] font-black text-primary hover:text-on-surface uppercase tracking-widest transition-colors">Full Registry</button>
                 </div>

                 <div className="space-y-4">
                    {reservations.length > 0 ? reservations.slice(0, 2).map((res, idx) => (
                       <div key={idx} className="p-6 bg-surface-container-low border border-outline-variant rounded-2xl flex items-center justify-between hover:border-primary/40 transition-all cursor-default">
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 bg-surface-container-highest border border-outline-variant rounded-xl flex items-center justify-center text-primary">
                                <Clock className="w-5 h-5" />
                             </div>
                             <div>
                                <span className="font-sans text-[10px] font-black text-primary uppercase tracking-widest">UPCOMING</span>
                                <h4 className="font-sans text-[15px] font-black text-on-surface uppercase tracking-tight mt-1">{new Date(res.date_reservation).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })}</h4>
                                <p className="font-body text-[13px] text-on-surface-variant italic">{res.heure_debut} • Table {res.table}</p>
                             </div>
                          </div>
                          <button aria-label={`Open reservation actions for table ${res.table}`} className="p-3 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all active:scale-75"><MoreVertical className="w-4 h-4" /></button>
                       </div>
                    )) : (
                       <div className="py-12 flex flex-col items-center justify-center opacity-20 gap-4">
                          <History className="w-12 h-12 stroke-[1]" />
                          <span className="font-sans text-[10px] font-black uppercase tracking-[0.4em]">Registry Clear</span>
                       </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Right: Actions & Tools (4 cols) */}
           <div className="lg:col-span-4 space-y-8">
              
              {/* Order History */}
              <div className="bg-surface-container border border-outline-variant rounded-3xl p-8 space-y-8 shadow-sm">
                 <h3 className="font-serif text-xl font-black text-on-surface uppercase tracking-tight italic border-b border-outline-variant/30 pb-4">Recent Sessions</h3>
                 <div className="space-y-3">
                    {commandes.slice(0, 3).map((cmd, i) => (
                       <div key={i} className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-all duration-500">
                          <div>
                             <p className="font-sans text-[13px] font-black text-on-surface uppercase tracking-tight">#{cmd.id}</p>
                             <p className="font-mono text-[9px] text-on-surface-variant uppercase">{new Date(cmd.created_at || "").toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                             <p className="font-sans text-[13px] font-black text-primary tabular-nums">{cmd.montant_total} DH</p>
                             <span className="font-sans text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Completed</span>
                          </div>
                       </div>
                    ))}
                 </div>
                 <button className="w-full py-4 border border-outline-variant/30 rounded-xl font-sans text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all">View Archive</button>
              </div>

              {/* Feedback CTA */}
              <button 
                onClick={() => setIsAvisModalOpen(true)}
                className="w-full bg-primary p-8 rounded-3xl text-on-primary cinematic-shadow relative overflow-hidden group transition-all hover:scale-[1.02] active:scale-98"
              >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-1000" />
                 <div className="relative z-10 text-left flex justify-between items-center">
                    <div>
                       <h4 className="font-serif text-xl font-black italic m-0">The Culinary Dialogue</h4>
                       <p className="font-sans text-[9px] font-black text-on-primary uppercase tracking-widest mt-2">Refine the neural experience</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-secondary-container" strokeWidth={1.5} />
                 </div>
              </button>

              {/* Quick Settings */}
              <div className="bg-surface-container border border-outline-variant rounded-3xl p-8 space-y-6">
                 <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em] border-b border-outline-variant/30 pb-4">Settings</h3>
                 <div className="space-y-4">
                    {[
                       { icon: UserIcon, label: "Personal Manifest" },
                       { icon: PaymentsIcon, label: "Settlement Methods" },
                       { icon: NotificationsIcon, label: "Communications" }
                    ].map((item, i) => (
                       <button key={i} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-highest transition-all group">
                          <div className="flex items-center gap-4 text-on-surface-variant group-hover:text-on-surface">
                             <item.icon className="w-4 h-4" />
                             <span className="font-sans text-[11px] font-bold uppercase tracking-tight">{item.label}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant" />
                       </button>
                    ))}
                 </div>
                 <div className="pt-4 border-t border-outline-variant/30">
                    <button onClick={() => logout()} className="w-full flex items-center gap-4 text-error p-2 rounded-lg hover:bg-error/5 transition-all font-sans text-[11px] font-black uppercase tracking-widest">
                       <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                 </div>
              </div>
           </div>
        </section>
      </main>

      {/* Cinematic Feedback Modal */}
      <AnimatePresence>
        {isAvisModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/95 backdrop-blur-2xl" onClick={() => setIsAvisModalOpen(false)} />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-2xl bg-surface-container border border-outline-variant rounded-[3rem] p-12 md:p-20 shadow-2xl overflow-hidden"
             >
                <button aria-label="Close feedback dialog" onClick={() => setIsAvisModalOpen(false)} className="absolute top-8 right-8 p-2 rounded-full hover:bg-surface-container-highest transition-colors"><X className="w-6 h-6" /></button>
                
                <div className="text-center space-y-12">
                   <div className="space-y-4">
                      <span className="editorial-kicker">Calibration</span>
                      <h2 className="font-serif text-4xl md:text-6xl font-black text-on-surface italic m-0">The Feedback.</h2>
                      <p className="font-body text-lg text-on-surface-variant italic leading-relaxed uppercase tracking-tight">Your insights refine the neural orchestration of the experience.</p>
                   </div>
                   
                   <form onSubmit={handleSubmitAvis} className="space-y-12">
                      <div className="flex justify-center gap-4">
                         {[1,2,3,4,5].map(s => (
                            <button aria-label={`Rate ${s} star${s === 1 ? '' : 's'}`} key={s} type="button" onClick={() => setRating(s)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${rating >= s ? 'bg-primary border-primary text-background' : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/40'}`}>
                               <Star className={`w-6 h-6 ${rating >= s ? 'fill-current' : ''}`} strokeWidth={1.5} />
                            </button>
                         ))}
                      </div>

                      <textarea value={comment} onChange={(e) => setComment(e.target.value)} required rows={4} className="w-full p-8 bg-surface-container-lowest border border-outline-variant rounded-3xl font-body text-xl italic text-on-surface focus:border-primary outline-none transition-all resize-none text-center" placeholder="DESCRIBE THE VOYAGE..." />

                      <button disabled={isSubmitting} type="submit" className="w-full py-6 bg-primary text-on-primary rounded-2xl font-sans text-xs font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4">
                         {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span>Commit Analysis</span><ArrowRight className="w-5 h-5" /></>}
                      </button>
                   </form>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MoreVertical = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
);



