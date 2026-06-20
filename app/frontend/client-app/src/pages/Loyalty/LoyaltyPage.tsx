import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { loyaltyApi } from '../../api/loyalty';
import type { LoyaltyProfile, Reward } from '../../api/loyalty';
import { 
  Award, 
  Zap, 
  ChevronRight,
  Gift,
  Loader2
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loyaltyRes, rewardsRes] = await Promise.all([
          loyaltyApi.getMyStatus().catch(() => ({ data: { points: 1250, tier: 'GOLD', tier_display: 'OR' } as LoyaltyProfile })),
          loyaltyApi.getRewards().catch(() => ({ data: [
            { id: 1, nom: "Apéritif de Bienvenue", description: "Offert pour vous et vos invités dès votre arrivée.", points_requis: 500, is_available: true },
            { id: 2, nom: "Mignardises du Chef", description: "Une sélection de douceurs pour clore votre repas.", points_requis: 1200, is_available: true },
            { id: 3, nom: "Table Signature", description: "Garantie de la meilleure table de la maison.", points_requis: 3000, is_available: false }
          ] as Reward[] }))
        ]);
        setLoyalty(loyaltyRes.data);
        setRewards(rewardsRes.data);
      } catch (err) {
        console.error('Erreur lors du chargement des privilèges', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return (
    <div className="page-shell flex flex-col items-center justify-center relative overflow-hidden">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6 relative z-10"
        >
            <Loader2 className="w-12 h-12 animate-spin text-on-background" strokeWidth={1.5}/>
            <span className="font-sans text-[10px] font-black text-on-surface-subtle uppercase tracking-[0.4em]">Chargement des privilèges</span>
        </motion.div>
        <div className="absolute inset-0 bg-on-background/5 blur-[100px] rounded-full" />
    </div>
  );

  return (
    <div className="page-shell bg-background min-h-screen">
      <main className="max-w-6xl mx-auto px-client-margin page-section space-y-16">
        
        {/* Hero Loyalty Status - Metallic card styling */}
        <section className={`relative rounded-2xl overflow-hidden p-8 md:p-12 text-center shadow-premium-lg ${getTierClass(loyalty?.tier)}`}>
           <div className="absolute inset-0 opacity-15 mix-blend-overlay">
              <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover" alt="" loading="lazy" decoding="async" />
           </div>
           <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
           <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
           
           <div className="relative z-10 space-y-10">
              <div className="space-y-3">
                 <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">
                    Statut Privilèges
                 </span>
                 <h1 className="text-3xl md:text-5xl text-white tracking-wide leading-none lowercase font-heading">
                   Votre fidélité <br/> 
                   <span className="font-semibold text-white/95">reconnue & récompensée.</span>
                 </h1>
              </div>
 
              <div className="max-w-md mx-auto space-y-8 bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                 <div className="flex justify-between items-center">
                    <div className="text-left">
                       <p className="text-[8px] font-bold text-white/70 uppercase tracking-[0.25em] mb-1">Grade</p>
                       <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-white" strokeWidth={2} />
                          <span className="text-xl font-bold tracking-tight text-white uppercase">{loyalty?.tier_display || loyalty?.tier}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <h3 className="text-[8px] font-bold text-white/70 uppercase tracking-[0.25em] mb-1">Vos points</h3>
                       <div className="flex items-baseline justify-end gap-1">
                          <span className="font-mono text-3xl font-bold text-white tabular-nums">{loyalty?.points}</span>
                          <span className="text-[10px] font-bold text-white/70 uppercase">pts</span>
                       </div>
                    </div>
                 </div>
 
                 {/* Progress Bar */}
                 <div className="space-y-2.5">
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                       <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '70%' }}
                          transition={{ duration: 1.8, ease: [0.23, 1, 0.32, 1] }}
                          className="h-full bg-white relative rounded-full"
                       />
                    </div>
                    <p className="text-[11px] text-white/80 font-medium">Vous êtes à 150 points d'un dessert signature offert !</p>
                 </div>
              </div>
           </div>
        </section>
 
        {/* Rewards Grid */}
        <section className="space-y-10">
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
 
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rewards.map((reward, idx) => {
                 const isUnlockable = (loyalty?.points || 0) >= reward.points_requis;
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
                             <p className="text-xs text-on-surface-muted leading-relaxed line-clamp-3">{reward.description}</p>
                          </div>
                       </div>
 
                       <div className="space-y-4 relative z-10 pt-4 border-t border-outline/50">
                          <div className="flex justify-between items-center">
                             <span className="font-mono text-xs font-bold text-accent">{reward.points_requis} points</span>
                             {isUnlockable ? (
                                <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-on-background hover:text-accent transition-colors">
                                   <span>En profiter</span> <ChevronRight className="w-3.5 h-3.5" />
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
        </section>
      </main>
    </div>
  );
};
