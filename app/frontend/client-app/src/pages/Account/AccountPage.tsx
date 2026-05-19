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
  History,
  MapPin,
  Settings,
  Bell,
  CreditCard
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
    <div className="flex-1 bg-[#fff8f5] selection:bg-[#8d4e1c]/10 selection:text-[#8d4e1c]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12 md:py-24">
        
        {/* Editorial Header */}
        <header className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="w-8 h-[2px] bg-[#8d4e1c]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8d4e1c]">Espace Privé</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-serif italic text-[#301400] leading-[0.9] tracking-tighter">
                    Tableau de Bord.
                </h1>
                <p className="max-w-md text-[#53443a] text-lg font-medium leading-relaxed opacity-80">
                    Gérez vos réservations, suivez vos commandes et consultez vos privilèges exclusifs Tastify.
                </p>
            </div>
            
            <div className="flex items-center gap-4">
                <button className="w-12 h-12 rounded-full border border-[#d8c2b6] flex items-center justify-center text-[#301400] hover:bg-white transition-all">
                    <Bell className="w-5 h-5" />
                </button>
                <button className="w-12 h-12 rounded-full border border-[#d8c2b6] flex items-center justify-center text-[#301400] hover:bg-white transition-all">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16">
            
            {/* Sidebar Profile */}
            <aside className="lg:col-span-4 space-y-12">
                <div className="p-10 bg-white border border-[#d8c2b6] rounded-[2rem] shadow-[0_24px_60px_rgba(48,20,0,0.04)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#8d4e1c]/5 blur-3xl -mr-16 -mt-16" />
                    
                    <div className="relative z-10 text-center">
                        <div className="w-24 h-24 rounded-3xl bg-[#fff1ea] border border-[#ffe3d2] flex items-center justify-center text-[#8d4e1c] mx-auto mb-8 shadow-inner">
                            <UserIcon className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#301400] mb-1">Mehdouch</h2>
                        <p className="text-[#8d4e1c] text-[10px] font-black uppercase tracking-[0.2em] mb-8">Membre Privilégié</p>
                        
                        <div className="space-y-3">
                            <button className="w-full py-4 bg-[#301400] text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#4b2709] transition-all active:scale-95 shadow-lg shadow-black/10">
                                <CreditCard className="w-4 h-4" />
                                Gérer Paiements
                            </button>
                            <button 
                                onClick={() => setIsAvisModalOpen(true)}
                                className="w-full py-4 bg-white border border-[#d8c2b6] text-[#301400] rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#fff8f5] transition-all active:scale-95"
                            >
                                <MessageSquare className="w-4 h-4 text-[#8d4e1c]" />
                                Laisser un Avis
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loyalty Focus */}
                {loyalty && (
                    <div className="p-10 bg-[#301400] text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#8d4e1c] opacity-20 blur-3xl -mr-32 -mt-32" />
                        
                        <div className="relative z-10">
                            <div className={`w-16 h-16 rounded-2xl mb-8 flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:rotate-12 ${getTierColor(loyalty.tier)}`}>
                                <Crown className="w-8 h-8" />
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8d4e1c] mb-2">Club Tastify</p>
                                    <h3 className="text-4xl font-serif italic tracking-tight">Statut {loyalty.tier_display || loyalty.tier}.</h3>
                                </div>
                                
                                <div className="p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl">
                                    <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.3em] mb-2">Points Accumulés</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-6xl font-bold tracking-tighter text-[#8d4e1c] leading-none">{loyalty.points}</span>
                                        <span className="text-xs font-bold text-white/60 mb-1">PTS</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 text-white/60">
                                    <Sparkles className="w-4 h-4 text-[#8d4e1c]" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Privilèges Actifs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content Hub */}
            <div className="lg:col-span-8 space-y-20">
                
                {/* Active Session / Order */}
                {activeOrder && (
                    <section className="animate-in slide-in-from-bottom-12 duration-1000">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-[#8d4e1c]/10 text-[#8d4e1c] flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                            <h3 className="text-3xl font-bold tracking-tight text-[#301400]">Session Active</h3>
                        </div>
                        
                        <div className="p-10 bg-white border border-[#d8c2b6] rounded-[2rem] relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[#8d4e1c]/5 blur-3xl -mr-48 -mt-48" />
                            
                            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                                <div className="w-32 h-32 rounded-[2rem] bg-[#fff1ea] border border-[#ffe3d2] flex items-center justify-center text-[#8d4e1c] shrink-0 relative">
                                    <ChefHat className="w-12 h-12" />
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-xl shadow-lg border border-[#d8c2b6] flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 animate-spin text-[#8d4e1c]" />
                                    </div>
                                </div>
                                
                                <div className="flex-1 space-y-6">
                                    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-[#fff1ea] border border-[#ffe3d2] ${getOrderStatusUI(activeOrder.statut).color}`}>
                                        {React.createElement(getOrderStatusUI(activeOrder.statut).icon, { className: "w-5 h-5" })}
                                        <span className="text-xs font-black uppercase tracking-widest">{getOrderStatusUI(activeOrder.statut).text}</span>
                                    </div>
                                    <h4 className="text-4xl font-serif italic text-[#301400] leading-none">Votre dégustation est en cours de préparation.</h4>
                                    
                                    <div className="flex items-center gap-10 pt-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-[#53443a] uppercase tracking-widest opacity-40">Valeur Totale</p>
                                            <p className="text-2xl font-bold text-[#301400]">{activeOrder.montant_total} DH</p>
                                        </div>
                                        <div className="w-[1px] h-10 bg-[#d8c2b6]" />
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-[#53443a] uppercase tracking-widest opacity-40">Session ID</p>
                                            <p className="text-2xl font-bold text-[#301400]">#{activeOrder.id}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Reservations List */}
                <section>
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#8d4e1c]/10 text-[#8d4e1c] flex items-center justify-center">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <h3 className="text-3xl font-bold tracking-tight text-[#301400]">Réservations à Venir</h3>
                        </div>
                        <button className="text-[10px] font-black uppercase tracking-widest text-[#8d4e1c] hover:underline underline-offset-8">Voir Historique</button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {reservations.length === 0 ? (
                            <div className="col-span-full p-20 bg-[#fff1ea] rounded-[2.5rem] border-2 border-dashed border-[#ffe3d2] text-center flex flex-col items-center gap-6">
                                <History className="w-12 h-12 text-[#8d4e1c] opacity-20" />
                                <p className="text-2xl font-serif italic text-[#301400]/40">Aucune réservation prévue pour le moment.</p>
                                <button className="px-8 py-3 bg-[#301400] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#4b2709] transition-all">Réserver une Table</button>
                            </div>
                        ) : (
                            reservations.map(res => (
                                <div key={res.id} className="p-8 bg-white border border-[#d8c2b6] rounded-3xl flex items-center justify-between group hover:border-[#8d4e1c] hover:shadow-xl transition-all duration-500">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-[#fff1ea] rounded-2xl flex flex-col items-center justify-center text-[#301400] border border-[#ffe3d2] group-hover:scale-105 transition-transform">
                                            <span className="text-[8px] font-black text-[#8d4e1c] uppercase tracking-widest leading-none mb-1">
                                                {new Date(res.date_reservation).toLocaleDateString('fr-FR', { month: 'short' })}
                                            </span>
                                            <span className="text-2xl font-bold tracking-tighter">
                                                {new Date(res.date_reservation).getDate()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-[#301400]">Table #{res.table}</p>
                                            <div className="flex items-center gap-3 mt-1 text-[#53443a] opacity-60">
                                                <Clock className="w-4 h-4 text-[#8d4e1c]" />
                                                <span className="text-xs font-medium">{res.heure_debut} — {res.heure_fin} • {res.nombre_personnes} pers.</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${res.statut === 'CONFIRMEE' ? 'bg-[#8d4e1c]/10 text-[#8d4e1c]' : 'bg-[#fff1ea] text-[#53443a]'}`}>
                                        {res.statut}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Experience Feedback */}
                <section>
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-[#8d4e1c]/10 text-[#8d4e1c] flex items-center justify-center">
                            <Star className="w-5 h-5" />
                        </div>
                        <h3 className="text-3xl font-bold tracking-tight text-[#301400]">Mes Expériences</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {avis.map(a => (
                            <div key={a.id} className="p-10 bg-white border border-[#d8c2b6] rounded-[2.5rem] group hover:border-[#8d4e1c] transition-all duration-700">
                                <div className="flex gap-2 mb-6">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-4 h-4 ${i < a.note ? 'text-[#8d4e1c] fill-[#8d4e1c]' : 'text-[#d8c2b6]'}`} />
                                    ))}
                                </div>
                                <p className="text-[#301400] text-xl font-serif italic leading-relaxed tracking-tight">"{a.commentaire}"</p>
                                <div className="mt-8 pt-8 border-t border-[#fff1ea] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${a.sentiment_score > 0 ? 'bg-[#8d4e1c]' : 'bg-outline-variant'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#53443a] opacity-40">Vérifié par AI</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-[#53443a]/40">{new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>

        {/* High-End Feedback Modal */}
        {isAvisModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                <div className="absolute inset-0 bg-[#301400]/80 backdrop-blur-2xl" onClick={() => setIsAvisModalOpen(false)} />
                <div className="relative w-full max-w-xl bg-white rounded-[3rem] overflow-hidden shadow-2xl p-12 animate-in zoom-in-95 duration-500">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fff1ea] text-[#8d4e1c] text-[10px] font-black uppercase tracking-widest mb-6">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Analyse d'Expérience</span>
                        </div>
                        <h3 className="text-5xl font-serif italic text-[#301400] mb-4">Votre avis.</h3>
                        <p className="text-[#53443a] font-medium opacity-60">Aidez-nous à perfectionner l'expérience Tastify.</p>
                    </div>
                    
                    <form onSubmit={handleSubmitAvis} className="space-y-12">
                        <div className="flex flex-col items-center gap-6">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#53443a] opacity-40">Évaluation Globale</label>
                            <div className="flex gap-4">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button 
                                        key={s} 
                                        type="button"
                                        onClick={() => setRating(s)}
                                        className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-500 ${rating >= s ? 'bg-[#8d4e1c] text-white scale-110 shadow-xl shadow-[#8d4e1c]/20' : 'bg-[#fff1ea] text-[#d8c2b6] hover:bg-[#ffe3d2]'}`}
                                    >
                                        <Star className={`w-7 h-7 ${rating >= s ? 'fill-current' : ''}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#53443a] opacity-40 ml-1">Commentaire Détaillé</label>
                            <textarea 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                required
                                rows={4}
                                className="w-full p-6 bg-[#fff1ea] border border-[#ffe3d2] rounded-[2rem] focus:bg-white focus:outline-none focus:border-[#8d4e1c] focus:ring-8 focus:ring-[#8d4e1c]/5 transition-all resize-none font-semibold text-[#301400]"
                                placeholder="Décrivez les nuances de votre voyage culinaire..."
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-6 bg-[#8d4e1c] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-4 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#8d4e1c]/20 active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <>
                                    <span>Publier mon Avis</span>
                                    <ArrowRight className="w-6 h-6" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

