import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { loyaltyApi } from '../../api/loyalty';
import type { LoyaltyProfile, Reward } from '../../api/loyalty';
import { toLoyaltyNumber } from '../../api/loyalty';
import { toast } from 'sonner';
import { 
  Award, 
  Zap, 
  ChevronRight,
  Gift,
  Loader2,
  ReceiptText
} from 'lucide-react';

const getTierClass = (tier?: string) => {
  switch (tier?.toUpperCase()) {
    case 'BRONZE':
      return 'tier-bronze';
    case 'SILVER':
    case 'ARGENT':
      return 'tier-silver';
    case 'GOLD':
    case 'OR':
      return 'tier-gold';
    case 'PLATINUM':
    case 'PLATINE':
      return 'tier-platinum';
    default:
      return 'tier-gold';
  }
};

export const LoyaltyPage: React.FC = () => {
  const [loyalty, setLoyalty] = useState<LoyaltyProfile | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [redeemingId, setRedeemingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [loyaltyRes, rewardsRes] = await Promise.all([
        loyaltyApi.getMyStatus(),
        loyaltyApi.getRewards()
      ]);
      setLoyalty(loyaltyRes.data);
      setRewards(rewardsRes.data);
    } catch (err) {
      console.error('Erreur lors du chargement des privilèges', err);
      setLoadError("Impossible de charger votre fidélité pour le moment.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRedeem = async (reward: Reward) => {
    setRedeemingId(reward.id);
    try {
      const res = await loyaltyApi.redeemReward(reward.id);
      toast.success(res.data.detail);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Échange impossible.");
    } finally {
      setRedeemingId(null);
    }
  };

  if (loadError) return (
    <div className="page-shell flex flex-col items-center justify-center px-client-margin text-center">
      <div className="max-w-md space-y-5">
        <ReceiptText className="w-10 h-10 mx-auto text-accent" strokeWidth={1.5} />
        <h1 className="text-2xl font-bold text-on-background lowercase font-heading">fidélité indisponible.</h1>
        <p className="text-sm text-on-surface-muted">{loadError}</p>
        <button onClick={fetchData} className="btn-primary h-11 px-6">Réessayer</button>
      </div>
    </div>
  );

  // Dynamic calculations for progress bar
  const points = toLoyaltyNumber(loyalty?.points);
  let progressPercent = 0;
  let nextRewardText = '';

  if (points < 500) {
    progressPercent = (points / 500) * 100;
    const nextPoints = 500 - points;
    nextRewardText = `Vous êtes à ${nextPoints.toFixed(0)} points d'atteindre le grade Argent !`;
  } else if (points < 1500) {
    progressPercent = ((points - 500) / 1000) * 100;
    const nextPoints = 1500 - points;
    nextRewardText = `Vous êtes à ${nextPoints.toFixed(0)} points d'atteindre le grade Or !`;
  } else {
    progressPercent = 100;
    nextRewardText = "Vous êtes membre Or d'exception ! Vous bénéficiez de tous nos privilèges.";
  }

  return (
    <div className="page-shell bg-background min-h-screen">
      <main className="max-w-6xl mx-auto px-client-margin page-section space-y-16">
        
        {/* Hero Loyalty Status - Metallic card styling */}
        <section className={`relative rounded-2xl overflow-hidden p-8 md:p-12 text-center shadow-premium-lg ${getTierClass(loyalty?.tier)}`}>
           <div className="absolute inset-0 opacity-15 mix-blend-overlay">
              <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=70&w=800" className="w-full h-full object-cover" alt="" loading="lazy" decoding="async" />
           </div>
           <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
           <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
           
           <div className="relative z-10 space-y-10">
              <div className="space-y-3">
                 <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">
                    Statut Privilèges
                 </span>
                 <h1 className="text-3xl md:text-5xl text-white tracking-wide leading-none lowercase font-heading text-center">
                   Votre fidélité <br/> 
                   <span className="font-semibold text-white/95">reconnue & récompensée.</span>
                 </h1>
                 <div className="max-w-md mx-auto space-y-8 bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                 <div className="flex justify-between items-center text-left">
                    <div>
                       <p className="text-[8px] font-bold text-white/70 uppercase tracking-[0.25em] mb-1">Grade</p>
                       <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-white" strokeWidth={2} />
                          {isLoading ? (
                            <div className="w-20 h-5 bg-white/20 rounded animate-pulse" />
                          ) : (
                            <span className="text-xl font-bold tracking-tight text-white uppercase">{loyalty?.tier_display || loyalty?.tier}</span>
                          )}
                       </div>
                    </div>
                    <div className="text-right">
                       <h3 className="text-[8px] font-bold text-white/70 uppercase tracking-[0.25em] mb-1">Vos points</h3>
                       <div className="flex items-baseline justify-end gap-1">
                          {isLoading ? (
                            <div className="w-16 h-8 bg-white/20 rounded animate-pulse" />
                          ) : (
                            <>
                              <span className="font-mono text-3xl font-bold text-white tabular-nums">{points}</span>
                              <span className="text-[10px] font-bold text-white/70 uppercase">pts</span>
                            </>
                          )}
                       </div>
                    </div>
                 </div>
   
                 {/* Progress Bar */}
                 <div className="space-y-2.5">
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                       {isLoading ? (
                         <div className="h-full w-1/3 bg-white/20 rounded-full animate-pulse" />
                       ) : (
                         <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1.8, ease: [0.23, 1, 0.32, 1] }}
                            className="h-full bg-white relative rounded-full"
                         />
                       )}
                    </div>
                    {isLoading ? (
                      <div className="w-3/4 h-3.5 bg-white/20 rounded animate-pulse" />
                    ) : (
                      <p className="text-[11px] text-white/80 font-medium text-left">{nextRewardText}</p>
                    )}
                 </div>
              </div>
              </div>
           </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {[
            { title: 'Gagner', text: '1 point gagné par 10 DH payés.' },
            { title: 'Créditer', text: 'Les points sont ajoutés après un paiement complet lié à votre compte.' },
            { title: 'Échanger', text: 'Vos points débloquent les récompenses disponibles.' },
          ].map(item => (
            <div key={item.title} className="bg-surface border border-outline rounded-xl p-5 shadow-premium">
              <span className="text-[9px] font-bold text-accent tracking-[0.25em] uppercase">{item.title}</span>
              <p className="mt-2 text-sm font-semibold text-on-background leading-relaxed">{item.text}</p>
            </div>
          ))}
        </section>
  
        {/* Rewards Grid */}
        <section className="space-y-10 text-left">
           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-outline/50 pb-5">
              <div>
                 <span className="text-[9px] font-bold text-accent tracking-[0.25em] uppercase block mb-1">Privilèges</span>
                 <h2 className="text-2xl font-bold text-on-background tracking-tight lowercase font-heading">avantages disponibles.</h2>
              </div>
              <div className="flex items-center gap-2 text-on-surface-subtle">
                 <Zap className="w-4 h-4 text-accent fill-current" />
                 <span className="text-[9px] font-bold tracking-[0.2em] uppercase">Conversion instantanée</span>
              </div>
           </div>
  
           {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[1, 2, 3].map((i) => (
                    <div
                       key={i}
                       className="p-6 rounded-xl border border-outline bg-surface-container-high/40 animate-pulse flex flex-col justify-between min-h-[280px]"
                    >
                       <div className="space-y-5">
                          <div className="w-12 h-12 rounded-lg bg-on-background/10" />
                          <div className="space-y-2">
                             <div className="w-32 h-5 bg-on-background/15 rounded animate-pulse" />
                             <div className="w-full h-3 bg-on-background/10 rounded animate-pulse" style={{ animationDelay: '0.15s' }} />
                             <div className="w-5/6 h-3 bg-on-background/10 rounded animate-pulse" style={{ animationDelay: '0.3s' }} />
                          </div>
                       </div>
                       <div className="space-y-4 pt-4 border-t border-outline/50 flex justify-between items-center">
                          <div className="w-16 h-4 bg-on-background/15 rounded animate-pulse" />
                          <div className="w-20 h-4 bg-on-background/10 rounded animate-pulse" />
                       </div>
                    </div>
                 ))}
              </div>
           ) : rewards.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-outline rounded-xl bg-surface/50">
                 <Gift className="w-10 h-10 mx-auto mb-3 text-on-surface-subtle" strokeWidth={1.5} />
                 <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-subtle">Aucune récompense disponible</p>
              </div>
           ) : (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rewards.map((reward, idx) => {
                 const isUnlockable = toLoyaltyNumber(loyalty?.points) >= toLoyaltyNumber(reward.points_requis);
                 const isRedeeming = redeemingId === reward.id;
                 return (
                    <motion.div
                       key={reward.id}
                       initial={{ opacity: 0, y: 15 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: idx * 0.08 }}
                       className={`group relative p-6 rounded-xl border flex flex-col justify-between min-h-[280px] shadow-premium transition-all duration-300 ${isUnlockable ? 'bg-surface border-outline hover:border-accent/40 hover:-translate-y-1' : 'bg-surface-container-high/40 border-transparent/10 grayscale opacity-60'}`}
                    >
                       <div className="space-y-5 relative z-10">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-500 ${isUnlockable ? 'bg-surface-container-high text-accent group-hover:bg-accent group-hover:text-background' : 'bg-surface-container-high/60 text-on-surface-subtle'}`}>
                             <Gift className="w-5 h-5" strokeWidth={2} />
                          </div>
                          <div className="space-y-2">
                             <h4 className="text-lg font-bold text-on-background leading-snug">{reward.nom}</h4>
                             <p className="text-xs text-on-surface-muted leading-relaxed line-clamp-3 font-normal">{reward.description}</p>
                          </div>
                       </div>
   
                       <div className="space-y-4 relative z-10 pt-4 border-t border-outline/50">
                          <div className="flex justify-between items-center">
                             <span className="font-mono text-xs font-bold text-accent">{reward.points_requis} points</span>
                             {isUnlockable ? (
                                <button
                                  onClick={() => handleRedeem(reward)}
                                  disabled={isRedeeming}
                                  className="min-h-[44px] flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-on-background hover:text-accent transition-colors disabled:opacity-50"
                                >
                                   {isRedeeming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><span>En profiter</span> <ChevronRight className="w-3.5 h-3.5" /></>}
                                </button>
                             ) : (
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-on-surface-subtle">Verrouillé</span>
                             )}
                          </div>
                       </div>
                       
                       <div className="absolute inset-0 bg-accent/[0.01] pointer-events-none" />
                    </motion.div>
                 );
              })}
           </div>
           )}
        </section>
      </main>
    </div>
  );
};
