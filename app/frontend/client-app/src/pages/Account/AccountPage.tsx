import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  PackageCheck,
  ChefHat,
  CheckCircle2,
  Clock,
  ArrowRight,
  History,
  CreditCard as PaymentsIcon,
  Bell as NotificationsIcon,
  ShoppingBag,
  Wine,
  UtensilsCrossed,
  ChevronRight
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { username } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Feedback form
  const [isAvisModalOpen, setIsAvisModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [resRes, , loyaltyRes, cmdRes] = await Promise.all([
        reservationApi.getMyReservations(),
        avisApi.getAvis(),
        loyaltyApi.getMyStatus().catch(() => ({ data: null })),
        api.get('/commandes/').catch(() => ({ data: [] }))
      ]);
      setReservations(resRes.data);
      if (loyaltyRes.data) {
          setLoyalty(loyaltyRes.data);
      }
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
        fetchData();
    } catch (err) {
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const activeOrder = commandes.find((c: any) => ['EN_COURS', 'EN_CUISINE', 'PRETE'].includes(c.statut));

  const getOrderStatusUI = (statut: string) => {
      switch (statut) {
          case 'EN_COURS': return { text: 'Validating Session', icon: Clock, color: 'text-primary' };
          case 'EN_CUISINE': return { text: 'Culinary Orchestration', icon: ChefHat, color: 'text-primary animate-pulse' };
          case 'PRETE': return { text: 'Signature Ready', icon: PackageCheck, color: 'text-primary' };
          default: return { text: 'Session Finalized', icon: CheckCircle2, color: 'text-outline' };
      }
  };

  if (isLoading) return <div className="min-h-[100dvh] flex items-center justify-center bg-background text-primary"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="flex-1 bg-background selection:bg-primary/10 selection:text-primary">
      <div className="max-w-7xl mx-auto px-client-margin py-12">
        
        {/* Header Section */}
        <section className="mb-16">
            <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-ui-label-bold text-secondary block mb-4"
            >
                Welcome Back
            </motion.span>
            <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-display-lg text-4xl md:text-6xl text-primary mb-2"
            >
                {username}
            </motion.h2>
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-body-lg text-on-surface-variant max-w-2xl"
            >
                Manage your preferences, track your dining rewards, and view your upcoming curated experiences.
            </motion.p>
        </section>

        {/* Bento Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-unit-lg">
            
            {/* Loyalty Progress Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="md:col-span-8 bg-surface-container-low p-unit-lg rounded-3xl flex flex-col justify-between border border-outline-variant hover:border-primary transition-all duration-500 cinematic-shadow group"
            >
                <div>
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-headline-md text-on-surface mb-1">Epicurean Rewards</h3>
                            <p className="text-body-md text-on-surface-variant">{loyalty?.tier_display || loyalty?.tier || 'Guest'} Status</p>
                        </div>
                        <div className="text-right">
                            <span className="text-display-lg text-5xl text-primary block">{loyalty?.points || 0}</span>
                            <span className="text-ui-label-bold text-on-surface-variant">TOTAL POINTS</span>
                        </div>
                    </div>
                    
                    <div className="relative w-full h-4 bg-surface-container-highest rounded-full overflow-hidden mb-4">
                        <div 
                            className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(((loyalty?.points || 0) % 500) / 5, 100)}%` }}
                        ></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-ui-label-bold text-on-surface-variant">{500 - ((loyalty?.points || 0) % 500)} POINTS TO NEXT TIER</span>
                        <span className="text-ui-label-bold text-primary">EVOLVING STATUS</span>
                    </div>
                </div>

                <div className="mt-12 flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { icon: UtensilsCrossed, label: "Complimentary Pairing" },
                        { icon: ChefHat, label: "Priority Booking" },
                        { icon: Wine, label: "Cellar Access", locked: true }
                    ].map((perk, i) => (
                        <div key={i} className={`min-w-[160px] p-6 bg-surface-container border border-outline-variant rounded-2xl transition-all group-hover:scale-105 ${perk.locked ? 'opacity-30 grayscale' : ''}`}>
                            <perk.icon className="w-6 h-6 text-primary mb-4" strokeWidth={1.5} />
                            <p className="text-ui-label-bold text-on-surface leading-tight text-xs">{perk.label}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Profile Settings Mini */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="md:col-span-4 bg-background p-unit-lg rounded-3xl border border-outline-variant flex flex-col gap-8 cinematic-shadow"
            >
                <h3 className="text-headline-md text-on-surface">Account</h3>
                <div className="space-y-6">
                    {[
                        { icon: UserIcon, title: "Personal Info", desc: "Identity & coordinates" },
                        { icon: PaymentsIcon, title: "Payment Methods", desc: "Vault management" },
                        { icon: NotificationsIcon, title: "Preferences", desc: "Dining & chronicles" }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-6 p-3 hover:bg-surface-container-low transition-colors rounded-2xl cursor-pointer group">
                            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background transition-all">
                                <item.icon className="w-5 h-5" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-ui-label-bold text-on-surface">{item.title}</p>
                                <p className="text-[11px] text-on-surface-variant font-body italic">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <button className="mt-auto w-full py-4 border-2 border-primary text-primary text-ui-button rounded-xl hover:bg-primary hover:text-on-primary transition-all active:scale-95">
                    Edit Profile
                </button>
            </motion.div>

            {/* Active Session - Special Bento Entry */}
            {activeOrder && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:col-span-12 bg-on-surface text-background p-10 rounded-[3rem] relative overflow-hidden group cinematic-shadow"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary opacity-20 blur-[120px] -mr-48 -mt-48 transition-transform duration-[2000ms] group-hover:scale-125" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                        <div className="w-24 h-24 rounded-3xl bg-background flex items-center justify-center text-primary shadow-2xl relative">
                            {React.createElement(getOrderStatusUI(activeOrder.statut).icon, { className: "w-10 h-10", strokeWidth: 1.5 })}
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-4 border-on-surface">
                                <Loader2 className="w-4 h-4 animate-spin text-background" strokeWidth={3} />
                            </div>
                        </div>
                        
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <span className="editorial-kicker text-primary/60">Live Orchestration</span>
                            <h4 className="text-display-lg text-3xl md:text-5xl text-background leading-none italic">
                                Your culinary manifestation is <span className="text-primary">in progress.</span>
                            </h4>
                        </div>

                        <div className="flex gap-10 border-l border-white/10 pl-12 hidden lg:flex">
                            <div className="space-y-1">
                                <p className="editorial-kicker text-[8px] opacity-40">Value</p>
                                <p className="text-3xl font-body font-black">{activeOrder.montant_total} <span className="text-xs opacity-40">DH</span></p>
                            </div>
                            <div className="space-y-1">
                                <p className="editorial-kicker text-[8px] opacity-40">ID</p>
                                <p className="text-3xl font-body font-black uppercase tracking-tight">#{activeOrder.id}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Upcoming Reservations */}
            <div className="md:col-span-6 space-y-6">
                <h3 className="text-headline-md text-on-surface px-2 flex items-center gap-4">
                    Upcoming <span className="h-[1px] flex-1 bg-on-surface/5" />
                </h3>
                
                {reservations.length === 0 ? (
                    <div className="p-12 border-2 border-dashed border-outline-variant rounded-3xl flex flex-col items-center gap-6 opacity-30">
                        <History className="w-12 h-12" strokeWidth={1} />
                        <p className="text-display-lg text-2xl italic">No upcoming sessions.</p>
                    </div>
                ) : (
                    <div className="group bg-background rounded-3xl overflow-hidden border border-outline-variant hover:border-primary transition-all duration-500 cinematic-shadow">
                        <div className="h-56 relative overflow-hidden">
                            <img 
                                src="https://images.unsplash.com/photo-1550966841-3ee5ad6ee1b7?auto=format&fit=crop&q=80&w=1200" 
                                alt="Ambience" 
                                className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                            />
                            <div className="absolute top-6 right-6 bg-primary text-on-primary px-4 py-1.5 rounded-full text-ui-label-bold text-[10px]">
                                {reservations[0].statut}
                            </div>
                        </div>
                        <div className="p-unit-lg space-y-8">
                            <div>
                                <p className="text-ui-label-bold text-secondary mb-2">TABLE UNIT #{reservations[0].table}</p>
                                <h4 className="text-display-lg text-3xl text-on-surface italic">Signature Placement.</h4>
                            </div>
                            
                            <div className="flex gap-10 border-t border-outline-variant pt-8">
                                <div>
                                    <span className="block text-[9px] text-ui-label-bold text-on-surface-variant opacity-40 mb-1">DATE</span>
                                    <p className="text-xl font-serif italic text-on-surface">{new Date(reservations[0].date_reservation).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}</p>
                                </div>
                                <div>
                                    <span className="block text-[9px] text-ui-label-bold text-on-surface-variant opacity-40 mb-1">TIME</span>
                                    <p className="text-xl font-serif italic text-on-surface">{reservations[0].heure_debut}</p>
                                </div>
                                <div>
                                    <span className="block text-[9px] text-ui-label-bold text-on-surface-variant opacity-40 mb-1">GUESTS</span>
                                    <p className="text-xl font-serif italic text-on-surface">{reservations[0].nombre_personnes} People</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Order History */}
            <div className="md:col-span-6 space-y-6">
                <h3 className="text-headline-md text-on-surface px-2 flex items-center gap-4">
                    Recent Logs <span className="h-[1px] flex-1 bg-on-surface/5" />
                </h3>
                
                <div className="space-y-4">
                    {commandes.slice(0, 3).map((cmd, i) => (
                        <div key={i} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant flex justify-between items-center hover:bg-surface-container-high transition-all cursor-pointer group">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center border border-outline-variant shadow-inner group-hover:scale-110 transition-transform">
                                    <ShoppingBag className="w-6 h-6 text-primary" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h5 className="text-ui-label-bold text-on-surface text-sm">Session #{cmd.id}</h5>
                                    <p className="text-body-md text-xs text-on-surface-variant italic">
                                        Ordered {new Date(cmd.created_at || "").toLocaleDateString()} • {cmd.montant_total} DH
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
                        </div>
                    ))}
                    <button className="w-full py-4 text-ui-label-bold text-primary hover:bg-primary/5 rounded-2xl transition-colors border-2 border-transparent hover:border-primary/10">
                        VIEW FULL ARCHIVE
                    </button>
                </div>

                {/* Feedback CTA */}
                <div className="mt-8 p-8 bg-primary rounded-[2rem] text-on-primary cinematic-shadow relative overflow-hidden group cursor-pointer" onClick={() => setIsAvisModalOpen(true)}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-1000" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="space-y-2">
                            <h4 className="text-xl font-serif italic">The Culinary Dialogue</h4>
                            <p className="text-[10px] text-on-primary/60 uppercase font-black tracking-widest">Share your gastronomic insights</p>
                        </div>
                        <MessageSquare className="w-8 h-8 text-secondary-container" strokeWidth={1} />
                    </div>
                </div>
            </div>
        </div>

        {/* Cinematic Feedback Modal */}
        {isAvisModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-on-surface/90 backdrop-blur-3xl" 
                    onClick={() => setIsAvisModalOpen(false)} 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-2xl bg-background rounded-[3rem] overflow-hidden cinematic-shadow p-12 lg:p-20"
                >
                    <div className="text-center mb-16">
                        <div className="flex items-center justify-center gap-3 mb-8">
                            <span className="h-[1px] w-8 bg-primary"></span>
                            <span className="editorial-kicker">Calibration</span>
                            <span className="h-[1px] w-8 bg-primary"></span>
                        </div>
                        <h3 className="text-display-lg text-4xl lg:text-6xl text-on-surface mb-4 leading-none italic">The Feedback.</h3>
                        <p className="text-lg font-body text-on-surface-variant opacity-60 italic">Your insights refine the neural orchestration of the experience.</p>
                    </div>
                    
                    <form onSubmit={handleSubmitAvis} className="space-y-12">
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex gap-4">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button 
                                        key={s} 
                                        type="button"
                                        onClick={() => setRating(s)}
                                        className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-500 ${rating >= s ? 'bg-primary text-background' : 'bg-surface-container text-on-surface-variant/20 hover:bg-surface-container-high'}`}
                                    >
                                        <Star className={`w-6 h-6 ${rating >= s ? 'fill-background' : ''}`} strokeWidth={1.5} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            required
                            rows={4}
                            className="w-full p-8 bg-surface-container border border-outline-variant rounded-3xl focus:bg-background focus:outline-none focus:border-primary transition-all resize-none font-body text-on-surface text-xl italic text-center"
                            placeholder="DESCRIBE THE NUANCES OF YOUR VOYAGE..."
                        />

                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-6 bg-on-surface text-background text-ui-button uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all hover:bg-primary active:scale-95 disabled:opacity-50 rounded-2xl"
                        >
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <>
                                    <span>Commit Analysis</span>
                                    <ArrowRight className="w-5 h-5 text-primary" strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        )}
      </div>
    </div>
  );
};


