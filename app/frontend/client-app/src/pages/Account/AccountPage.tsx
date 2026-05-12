import React, { useState, useEffect } from 'react';
import { reservationApi } from '../../api/reservations';
import type { Reservation } from '../../api/reservations';
import { avisApi } from '../../api/avis';
import type { Avis } from '../../api/avis';
import { loyaltyApi } from '../../api/loyalty';
import type { LoyaltyProfile } from '../../api/loyalty';
import { api } from '../../api/axios';
import { 
  Calendar, 
  MessageSquare, 
  Star, 
  Loader2, 
  User as UserIcon,
  Crown,
  ShoppingBag,
  PackageCheck,
  ChefHat,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  History
} from 'lucide-react';

export const AccountPage: React.FC = () => {
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
          case 'GOLD': return 'bg-amber-400 text-on-surface';
          case 'PLATINUM': return 'bg-primary text-white shadow-lg shadow-primary/30';
          default: return 'bg-surface-container text-on-surface-variant';
      }
  };

  const activeOrder = commandes.find((c: any) => ['EN_COURS', 'EN_CUISINE', 'PRETE'].includes(c.statut));

  const getOrderStatusUI = (statut: string) => {
      switch (statut) {
          case 'EN_COURS': return { text: 'Validating Session', icon: Clock, color: 'text-on-surface-variant' };
          case 'EN_CUISINE': return { text: 'Culinary Orchestration', icon: ChefHat, color: 'text-primary animate-pulse' };
          case 'PRETE': return { text: 'Signature Ready for Pickup', icon: PackageCheck, color: 'text-primary' };
          default: return { text: 'Session Finalized', icon: CheckCircle2, color: 'text-outline' };
      }
  };

  if (isLoading) return <div className="min-h-[100dvh] flex items-center justify-center bg-background text-primary"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="flex-1 max-w-[1600px] mx-auto px-5 md:px-8 py-10 md:py-24 w-full animate-in fade-in duration-700 bg-background overflow-x-hidden">
        <div className="flex flex-col xl:flex-row gap-10 md:gap-16">
            {/* Architectural Profile Card */}
            <aside className="xl:w-[400px] shrink-0 space-y-8 md:space-y-10">
                <div className="p-8 md:p-12 bg-white double-bezel text-center relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#0040e0 1px, transparent 1px), linear-gradient(90deg, #0040e0 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                    <div className="relative z-10">
                        <div className="w-20 md:w-28 h-20 md:h-28 rounded-2xl md:rounded-3xl bg-surface-container-low border border-surface-container-high flex items-center justify-center text-primary mx-auto mb-6 md:mb-8 shadow-inner transition-transform group-hover:scale-105 duration-700">
                            <UserIcon className="w-10 md:w-12 h-10 md:h-12" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface mb-2 font-sans">Client Profile</h2>
                        <p className="text-on-surface-variant font-bold uppercase text-[8px] md:text-[10px] tracking-[0.3em] mb-8 md:mb-10 opacity-40">Architectural Member</p>
                        
                        <button 
                            onClick={() => setIsAvisModalOpen(true)}
                            className="w-full py-4 glass text-on-surface rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all hover:bg-white active:scale-95 border border-surface-container-high"
                        >
                            <MessageSquare className="w-4 h-4 text-primary" />
                            Submit Review
                        </button>
                    </div>
                </div>

                {/* Exclusive Loyalty Tier */}
                {loyalty && (
                    <div className="p-8 md:p-12 bg-on-surface text-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-10 blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000" />
                        <div className="relative z-10">
                            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:rotate-12 ${getTierColor(loyalty.tier)}`}>
                                <Crown className="w-7 md:w-8 h-7 md:h-8" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2 font-sans italic font-display-accent text-center">The Club.</h3>
                            <div className="flex justify-center mb-8 md:mb-10">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/10">
                                    <Sparkles className="w-3 h-3 text-primary" />
                                    <span>{loyalty.tier_display || loyalty.tier} STATUS</span>
                                </div>
                            </div>
                            
                            <div className="p-6 md:p-8 bg-white/5 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-xl text-center">
                                <p className="text-[8px] md:text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mb-2 md:mb-3">Allocated Points</p>
                                <p className="text-4xl md:text-6xl font-bold font-sans text-primary tracking-tighter">{loyalty.points}</p>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Operational Hub */}
            <div className="flex-1 space-y-12 md:space-y-20">
                {/* Active Session Tracker */}
                {activeOrder && (
                    <section className="animate-in slide-in-from-bottom-12 duration-1000">
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary-container/20 text-primary flex items-center justify-center">
                                    <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface font-sans">Active Session</h3>
                            </div>
                            <div className="glass px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold text-primary uppercase tracking-widest border border-primary/10">
                                Session #{activeOrder.id}
                            </div>
                        </div>
                        
                        <div className="p-6 md:p-10 bg-white double-bezel relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-primary opacity-[0.03] blur-3xl -mr-32 -mt-32" />
                            
                            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10 text-center md:text-left">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[1.5rem] md:rounded-[2rem] bg-surface-container-low border border-surface-container-high flex items-center justify-center text-primary shrink-0 shadow-sm relative">
                                    <ShoppingBag className="w-10 md:w-12 h-10 md:h-12" />
                                    <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg md:rounded-xl shadow-lg border border-surface-container-high flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4 md:space-y-6">
                                    <div className={`inline-flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-surface-container-low border border-surface-container-high ${getOrderStatusUI(activeOrder.statut).color}`}>
                                        {React.createElement(getOrderStatusUI(activeOrder.statut).icon, { className: "w-4 h-4 md:w-5 md:h-5" })}
                                        <span className="text-xs font-bold uppercase tracking-widest font-sans">{getOrderStatusUI(activeOrder.statut).text}</span>
                                    </div>
                                    <h4 className="text-2xl md:text-4xl font-display-accent italic text-on-surface leading-tight md:leading-none">The culinary process is in motion.</h4>
                                    <div className="flex items-center justify-center md:justify-start gap-6 md:gap-8 pt-2">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] md:text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">Value</span>
                                            <span className="text-base md:text-xl font-bold text-on-surface font-sans">{activeOrder.montant_total} DH</span>
                                        </div>
                                        <div className="w-[1px] h-8 md:h-10 bg-surface-container-high" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] md:text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">Estimate</span>
                                            <span className="text-base md:text-xl font-bold text-on-surface font-sans">12:45 PM</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full md:w-auto px-8 py-4 bg-primary text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-3">
                                    <span>View Details</span>
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* Reserved Placements */}
                <section>
                    <div className="flex items-center justify-between mb-8 md:mb-10">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary-container/20 text-primary flex items-center justify-center">
                                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface font-sans">Upcoming Placements</h3>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {reservations.length === 0 ? (
                            <div className="col-span-full p-12 md:p-20 bg-surface-container-low rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-dashed border-surface-container-high text-center text-on-surface-variant opacity-30 flex flex-col items-center gap-4 md:gap-6">
                                <History className="w-10 h-10 md:w-12 md:h-12" />
                                <p className="text-lg md:text-xl font-display-accent italic">The reservation logs are silent.</p>
                            </div>
                        ) : (
                            reservations.map(res => (
                                <div key={res.id} className="p-5 md:p-8 bg-white double-bezel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 md:gap-8 group hover:bg-surface-container-lowest hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                                    <div className="flex items-center gap-5 md:gap-8">
                                        <div className="flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-surface-container-low rounded-xl md:rounded-2xl text-on-surface border border-surface-container-high transition-transform group-hover:scale-105">
                                            <span className="text-[8px] md:text-[10px] uppercase font-black text-primary leading-none mb-1 md:mb-1.5 tracking-widest">
                                                {new Date(res.date_reservation).toLocaleDateString('fr-FR', { month: 'short' })}
                                            </span>
                                            <span className="text-2xl md:text-3xl font-bold leading-none font-sans tracking-tighter">
                                                {new Date(res.date_reservation).getDate()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg md:text-xl text-on-surface font-sans tracking-tight">Table Placement #{res.table}</p>
                                            <div className="flex items-center gap-2 md:gap-3 mt-1 text-on-surface-variant font-medium opacity-60">
                                                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                                                <span className="text-xs md:text-sm">{res.heure_debut} — {res.heure_fin} • {res.nombre_personnes} Guests</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`
                                        px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] self-end sm:self-auto
                                        ${res.statut === 'CONFIRMEE' ? 'bg-primary-container/10 text-primary border border-primary/20' : 'bg-surface-container text-on-surface-variant border border-surface-container-high'}
                                    `}>
                                        {res.statut}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Experience Feedback */}
                <section>
                    <div className="flex items-center justify-between mb-8 md:mb-10">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary-container/20 text-primary flex items-center justify-center">
                                <Star className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface font-sans">Verified Reviews</h3>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {avis.map(a => (
                            <div key={a.id} className="p-8 md:p-10 bg-surface-container-low rounded-[1.5rem] md:rounded-[2.5rem] border border-surface-container-high group hover:bg-white hover:shadow-xl transition-all duration-700">
                                <div className="flex gap-1.5 mb-4 md:mb-6">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform group-hover:scale-110 ${i < a.note ? 'text-primary fill-primary' : 'text-surface-container-highest'}`} />
                                    ))}
                                </div>
                                <p className="text-on-surface text-base md:text-lg leading-relaxed italic font-display-accent tracking-tight">"{a.commentaire}"</p>
                                {a.sentiment_score !== undefined && (
                                    <div className="mt-6 md:mt-8 flex items-center gap-2 md:gap-3">
                                        <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shadow-lg ${a.sentiment_score > 0 ? 'bg-primary animate-pulse' : a.sentiment_score < 0 ? 'bg-error' : 'bg-outline-variant'}`} />
                                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-40">AI-Validated Experience Hub</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>

        {/* High-End Feedback Modal */}
        {isAvisModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                <div className="absolute inset-0 bg-on-surface/80 backdrop-blur-2xl" onClick={() => setIsAvisModalOpen(false)} />
                <div className="relative w-full max-w-xl bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl p-8 md:p-12 animate-in zoom-in-95 duration-500">
                    <div className="text-center mb-8 md:mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-primary text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-4 md:mb-6">
                            <Sparkles className="w-3 h-3" />
                            <span>Experience Analysis</span>
                        </div>
                        <h3 className="text-3xl md:text-5xl font-display-accent italic text-on-surface mb-3 md:mb-4">Share your taste.</h3>
                        <p className="text-sm md:text-on-surface-variant font-medium opacity-60">Help us refine our architectural culinary algorithms.</p>
                    </div>
                    
                    <form onSubmit={handleSubmitAvis} className="space-y-8 md:space-y-10">
                        <div className="flex flex-col items-center gap-4 md:gap-6">
                            <label className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-40">Quality Assessment</label>
                            <div className="flex gap-2 md:gap-4">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button 
                                        key={s} 
                                        type="button"
                                        onClick={() => setRating(s)}
                                        className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg md:rounded-xl transition-all duration-500 ${rating >= s ? 'bg-primary text-white scale-110 shadow-xl shadow-primary/20' : 'bg-surface-container-low text-surface-container-highest hover:bg-surface-container-high'}`}
                                    >
                                        <Star className={`w-5 h-5 md:w-6 md:h-6 ${rating >= s ? 'fill-current' : ''}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 md:gap-4">
                            <label className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-40 ml-1">Detailed Context</label>
                            <textarea 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                required
                                rows={3}
                                className="w-full p-4 md:p-6 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none font-semibold text-sm md:text-base text-on-surface"
                                placeholder="Describe the nuances of your culinary journey..."
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 md:py-5 bg-primary text-white rounded-xl md:rounded-2xl font-bold text-base md:text-lg flex items-center justify-center gap-3 md:gap-4 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20 active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : (
                                <>
                                    <span>Deploy Feedback</span>
                                    <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
