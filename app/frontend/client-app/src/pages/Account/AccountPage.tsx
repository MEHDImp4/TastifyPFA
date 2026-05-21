import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { reservationApi } from '../../api/reservations';
import type { Reservation } from '../../api/reservations';
import { avisApi } from '../../api/avis';
import type { Avis } from '../../api/avis';
import { loyaltyApi } from '../../api/loyalty';
import type { LoyaltyProfile } from '../../api/loyalty';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { 
  MessageSquare, 
  Star, 
  Loader2, 
  User as UserIcon,
  Crown,
  PackageCheck,
  ChefHat,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  History,
  Settings,
  Bell,
  CreditCard,
  Users
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { username } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [avis, setAvis] = useState<Avis[]>([]);
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
      const [resRes, avisRes, loyaltyRes, cmdRes] = await Promise.all([
        reservationApi.getMyReservations(),
        avisApi.getAvis(),
        loyaltyApi.getMyStatus().catch(() => ({ data: null })),
        api.get('/commandes/').catch(() => ({ data: [] }))
      ]);
      setReservations(resRes.data);
      setAvis(avisRes.data);
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

  const getTierColor = (tier: string) => {
      switch (tier) {
          case 'BRONZE': return 'bg-[#CD7F32] text-white';
          case 'SILVER': return 'bg-slate-400 text-white';
          case 'GOLD': return 'bg-[#FFD700] text-[#301400]';
          case 'PLATINUM': return 'bg-[#8d4e1c] text-white shadow-lg shadow-[#8d4e1c]/30';
          default: return 'bg-surface-container text-on-surface-variant';
      }
  };

  const activeOrder = commandes.find((c: any) => ['EN_COURS', 'EN_CUISINE', 'PRETE'].includes(c.statut));

  const getOrderStatusUI = (statut: string) => {
      switch (statut) {
          case 'EN_COURS': return { text: 'Validating Session', icon: Clock, color: 'text-[#8d4e1c]' };
          case 'EN_CUISINE': return { text: 'Culinary Orchestration', icon: ChefHat, color: 'text-[#8d4e1c] animate-pulse' };
          case 'PRETE': return { text: 'Signature Ready', icon: PackageCheck, color: 'text-[#8d4e1c]' };
          default: return { text: 'Session Finalized', icon: CheckCircle2, color: 'text-outline' };
      }
  };

  if (isLoading) return <div className="min-h-[100dvh] flex items-center justify-center bg-[#fff8f5] text-[#8d4e1c]"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="flex-1 bg-background selection:bg-primary/10 selection:text-primary">
      <div className="max-w-[1400px] mx-auto px-8 py-12 md:py-20">
        
        {/* Editorial Header */}
        <header className="mb-12 md:mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <span className="h-[1px] w-12 bg-primary" />
                    <span className="editorial-kicker">Private Echelon</span>
                </div>
                <h1 className="text-display-lg text-4xl md:text-6xl lg:text-7xl text-on-surface leading-none">
                    Registry <br /><span className="italic font-light">Overview.</span>
                </h1>
                <p className="max-w-xl text-on-surface-variant text-lg font-body leading-relaxed italic opacity-80">
                    Orchestrate your upcoming sessions, track active culinary Manifests, and monitor your exclusive privileges within the Tastify ecosystem.
                </p>
            </div>
            
            <div className="flex items-center gap-4">
                <button className="w-14 h-14 rounded-full border border-on-surface/5 bg-surface-container-low flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-all cinematic-shadow">
                    <Bell className="w-5 h-5" strokeWidth={1.5} />
                </button>
                <button className="w-14 h-14 rounded-full border border-on-surface/5 bg-surface-container-low flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-all cinematic-shadow">
                    <Settings className="w-5 h-5" strokeWidth={1.5} />
                </button>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Sidebar Profile - Editorial Card */}
            <aside className="lg:col-span-4 xl:col-span-3 space-y-8">
                <div className="editorial-card p-10 relative overflow-hidden cinematic-shadow">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] -mr-16 -mt-16" />
                    
                    <div className="relative z-10 text-center flex flex-col items-center">
                        <div className="w-24 h-24 rounded-[2rem] bg-surface-container-high border border-on-surface/5 flex items-center justify-center text-primary mb-6 shadow-inner">
                            <UserIcon className="w-10 h-10" strokeWidth={1} />
                        </div>
                        <h2 className="text-2xl font-serif italic text-on-surface mb-1 uppercase tracking-tight">{username}</h2>
                        <span className="editorial-kicker text-[8px] mb-8 opacity-60">Verified Identity</span>
                        
                        <div className="space-y-4 w-full">
                            <button className="w-full py-4 bg-on-surface text-background text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-primary transition-all active:scale-95 cinematic-shadow">
                                <CreditCard className="w-4 h-4 text-primary" strokeWidth={1.5} />
                                Manage Vault
                            </button>
                            <button 
                                onClick={() => setIsAvisModalOpen(true)}
                                className="w-full py-4 bg-background border border-on-surface/10 text-on-surface text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-surface-container-low transition-all active:scale-95"
                            >
                                <MessageSquare className="w-4 h-4 text-primary" strokeWidth={1.5} />
                                Log Feedback
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loyalty Tier - Dark Premium */}
                {loyalty && (
                    <div className="p-10 bg-on-surface text-background rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-20 blur-[100px] -mr-32 -mt-32 transition-transform duration-[2000ms] group-hover:scale-125" />
                        
                        <div className="relative z-10 space-y-10">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-1000 group-hover:rotate-12 ${getTierColor(loyalty.tier)}`}>
                                <Crown className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <span className="editorial-kicker text-[8px] opacity-40">Privilege Status</span>
                                    <h3 className="text-3xl md:text-4xl font-serif italic text-background leading-none mt-2">{loyalty.tier_display || loyalty.tier} Tier</h3>
                                </div>
                                
                                <div className="p-8 bg-background/5 rounded-[2rem] border border-white/5 backdrop-blur-3xl">
                                    <span className="editorial-kicker text-[7px] text-background opacity-20 mb-3 block">Neural Points</span>
                                    <div className="flex items-end gap-3">
                                        <span className="text-display-lg text-5xl md:text-6xl text-primary leading-none">{loyalty.points}</span>
                                        <span className="text-ui-label-bold text-xs text-background opacity-20 mb-2 font-black tracking-widest">METRIC UNITS</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 text-background opacity-40">
                                    <Sparkles className="w-4 h-4 text-primary" strokeWidth={1.5} />
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">Signature Access Active</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content Hub */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-12">
                
                {/* Active Session - High Contrast */}
                {activeOrder && (
                    <section className="animate-in slide-in-from-bottom-10 duration-1000">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="editorial-kicker">Live Orchestration</span>
                        </div>
                        
                        <div className="editorial-card p-10 relative overflow-hidden cinematic-shadow">
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[120px] -mr-48 -mt-48" />
                            
                            <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-surface-container-high border border-on-surface/5 flex items-center justify-center text-primary shrink-0 relative shadow-inner">
                                    <ChefHat className="w-12 h-12" strokeWidth={1} />
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-background rounded-2xl shadow-xl border border-on-surface/5 flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" strokeWidth={2.5} />
                                    </div>
                                </div>
                                
                                <div className="flex-1 space-y-6 text-center md:text-left">
                                    <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-container border border-on-surface/5 ${getOrderStatusUI(activeOrder.statut).color}`}>
                                        {React.createElement(getOrderStatusUI(activeOrder.statut).icon, { className: "w-4 h-4", strokeWidth: 2.5 })}
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">{getOrderStatusUI(activeOrder.statut).text.toUpperCase()}</span>
                                    </div>
                                    <h4 className="text-display-lg text-3xl md:text-4xl text-on-surface leading-tight">Your manifestation is currently <span className="italic font-light">in orchestration.</span></h4>
                                    
                                    <div className="flex items-center justify-center md:justify-start gap-12 pt-4">
                                        <div className="space-y-1">
                                            <p className="editorial-kicker text-[7px] opacity-40">Session Value</p>
                                            <p className="text-2xl font-body text-on-surface font-black">{activeOrder.montant_total} <span className="text-xs opacity-40">DH</span></p>
                                        </div>
                                        <div className="w-[1px] h-10 bg-on-surface/5" />
                                        <div className="space-y-1">
                                            <p className="editorial-kicker text-[7px] opacity-40">Orchestration ID</p>
                                            <p className="text-2xl font-body text-on-surface font-black uppercase tracking-tight">#{activeOrder.id}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Upcoming Bookings - Minimal Editorial Grid */}
                <section>
                    <div className="flex items-center justify-between mb-8 border-b border-on-surface/5 pb-4">
                        <div className="flex items-center gap-4">
                            <span className="editorial-kicker">Temporal Placements</span>
                        </div>
                        <button className="text-[9px] font-black uppercase tracking-[0.3em] text-primary border-b border-primary/20 pb-1 hover:border-primary transition-all">View Archive</button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {reservations.length === 0 ? (
                            <div className="col-span-full py-24 editorial-card bg-surface-container-low border-dashed border-2 flex flex-col items-center gap-6 opacity-30">
                                <History className="w-12 h-12" strokeWidth={1} />
                                <p className="text-display-lg text-3xl italic">No sessions logged.</p>
                                <button className="px-10 py-4 bg-on-surface text-background text-[10px] font-black uppercase tracking-[0.3em]">Initialize Booking</button>
                            </div>
                        ) : (
                            reservations.map(res => (
                                <motion.div 
                                    key={res.id} 
                                    whileHover={{ y: -5 }}
                                    className="p-8 bg-background border border-on-surface/5 rounded-[2rem] flex flex-col justify-between gap-8 group hover:border-primary cinematic-shadow transition-all duration-500"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="w-14 h-14 bg-surface-container-high rounded-2xl flex flex-col items-center justify-center text-on-surface border border-on-surface/5 group-hover:scale-105 transition-transform shrink-0 shadow-inner">
                                            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">
                                                {new Date(res.date_reservation).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                                            </span>
                                            <span className="text-2xl font-serif italic">
                                                {new Date(res.date_reservation).getDate()}
                                            </span>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] ${res.statut === 'CONFIRMEE' ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                                            {res.statut}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <h4 className="text-xl font-serif italic text-on-surface uppercase tracking-tight">Table Unit #{res.table}</h4>
                                        <div className="flex items-center gap-6 text-[9px] font-black text-on-surface-variant uppercase tracking-[0.3em] opacity-40">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-primary" strokeWidth={1.5} />
                                                <span>{res.heure_debut} — {res.heure_fin}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-primary" strokeWidth={1.5} />
                                                <span>{res.nombre_personnes}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </section>

                {/* Experiences Feedback - Editorial Carousel style */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <span className="editorial-kicker">Culinary Dialogues</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {avis.map(a => (
                            <div key={a.id} className="p-8 editorial-card group relative overflow-hidden transition-all duration-1000">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -rotate-12 translate-x-8 -translate-y-8" />
                                <div className="flex gap-2 mb-8">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-4 h-4 ${i < a.note ? 'text-primary fill-primary' : 'text-on-surface/5'}`} strokeWidth={1.5} />
                                    ))}
                                </div>
                                <p className="text-2xl font-serif italic text-on-surface leading-relaxed tracking-tight line-clamp-3">“{a.commentaire.toUpperCase()}”</p>
                                <div className="mt-10 pt-8 border-t border-on-surface/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${(a.sentiment_score ?? 0) > 0 ? 'bg-primary animate-pulse' : 'bg-on-surface/20'}`} />
                                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-on-surface-variant opacity-40">AI Neural Verified</span>
                                    </div>
                                    <span className="text-[9px] font-black text-on-surface-variant/20 tracking-widest">{new Date(a.created_at || "").toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>

        {/* Cinematic Feedback Modal */}
        {isAvisModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 lg:p-12">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-on-surface/90 backdrop-blur-3xl" 
                    onClick={() => setIsAvisModalOpen(false)} 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                    className="relative w-full max-w-2xl bg-background rounded-[3rem] overflow-hidden cinematic-shadow p-12 lg:p-20"
                >
                    <div className="text-center mb-16">
                        <div className="flex items-center justify-center gap-3 mb-8">
                            <span className="h-[1px] w-8 bg-primary"></span>
                            <span className="editorial-kicker">Experience Analysis</span>
                            <span className="h-[1px] w-8 bg-primary"></span>
                        </div>
                        <h3 className="text-display-lg text-4xl lg:text-6xl text-on-surface mb-4 leading-none">The <br /><span className="italic font-light">Feedback.</span></h3>
                        <p className="text-lg font-body text-on-surface-variant opacity-60 italic">Your insights refine the neural orchestration of the Tastify experience.</p>
                    </div>
                    
                    <form onSubmit={handleSubmitAvis} className="space-y-12">
                        <div className="flex flex-col items-center gap-6">
                            <span className="editorial-kicker text-[8px] opacity-40">Global Calibration</span>
                            <div className="flex gap-4">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button 
                                        key={s} 
                                        type="button"
                                        onClick={() => setRating(s)}
                                        className={`w-16 h-16 flex items-center justify-center rounded-3xl transition-all duration-700 ${rating >= s ? 'bg-on-surface text-background scale-110 cinematic-shadow' : 'bg-surface-container text-on-surface-variant/20 hover:bg-surface-container-high'}`}
                                    >
                                        <Star className={`w-8 h-8 ${rating >= s ? 'fill-primary text-primary' : ''}`} strokeWidth={1} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <label className="editorial-kicker text-[8px] opacity-40 text-center">Detailed Culinary Dialogue</label>
                            <textarea 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                required
                                rows={4}
                                className="w-full p-8 bg-surface-container border border-on-surface/5 rounded-[2.5rem] focus:bg-background focus:outline-none focus:border-primary focus:ring-[12px] focus:ring-primary/5 transition-all resize-none font-body text-on-surface text-xl italic text-center cinematic-shadow"
                                placeholder="DESCRIBE THE NUANCES OF YOUR CULINARY VOYAGE..."
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-6 bg-on-surface text-background text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all hover:bg-primary cinematic-shadow active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin text-primary" strokeWidth={2.5} /> : (
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

