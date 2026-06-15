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
    <div className="page-shell">
      <main className="max-w-7xl mx-auto px-client-margin page-section space-y-20">
        
        {/* Hero Loyalty Status */}
        <section className="relative rounded-lg overflow-hidden bg-on-background p-8 md:p-16 text-center shadow-xl">
           <div className="absolute inset-0 opacity-10 mix-blend-overlay">
              <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover" alt="" loading="lazy" decoding="async" />
           </div>
           
           <div className="relative z-10 space-y-12">
              <div className="space-y-4">
                 <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-sans text-[11px] font-black uppercase tracking-widest text-background/70"
                 >
                    Programme fidélité
                 </motion.span>
                 <h1 className="text-4xl md:text-7xl text-background tracking-tight leading-none m-0">Vos points <br/> <span className="font-black text-background/70">et avantages.</span></h1>
              </div>

              <div className="max-w-xl mx-auto space-y-10">
                 <div className="flex justify-between items-end">
                    <div className="text-left">
                       <p className="font-sans text-[10px] font-black text-background/70 uppercase tracking-widest mb-1">Grade actuel</p>
                       <div className="flex items-center gap-3">
                          <Award className="w-6 h-6 text-background" />
                          <span className="text-3xl font-black text-background tracking-tight">{loyalty?.tier_display}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="font-sans text-4xl font-black text-background tabular-nums">{loyalty?.points}</span>
                       <span className="font-sans text-[10px] font-black text-background/70 uppercase tracking-widest ml-3">Points cumulés</span>
                    </div>
                 </div>

                 {/* Progress Bar */}
                 <div className="space-y-4">
                    <div className="w-full h-2.5 bg-background/10 rounded-full overflow-hidden border border-white/10">
                       <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '65%' }}
                          transition={{ duration: 1.8, ease: [0.23, 1, 0.32, 1] }}
                          className="h-full bg-background relative"
                       />
                    </div>
                    <p className="font-body text-[13px] text-background/70">Vous vous rapprochez du prochain avantage.</p>
                 </div>
              </div>
           </div>
        </section>

        {/* Rewards Grid */}
        <section className="space-y-12">
           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-outline pb-6">
              <div>
                 <h2 className="text-4xl font-black text-on-background tracking-tight m-0">Avantages disponibles</h2>
                 <p className="font-sans text-[10px] font-black text-on-surface-variant tracking-widest mt-2">Échangez vos points au restaurant</p>
              </div>
              <div className="flex items-center gap-3 text-on-surface-variant">
                 <Zap className="w-4 h-4 fill-current" />
                 <span className="font-sans text-[10px] font-black tracking-widest">Compte fidélité</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {rewards.map((reward, idx) => {
                 const isUnlockable = (loyalty?.points || 0) >= reward.points_requis;
                 return (
                    <motion.div
                       key={reward.id}
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: idx * 0.1 }}
                       whileHover={isUnlockable ? { y: -8, scale: 1.02 } : {}}
                       className={`group relative p-6 md:p-8 rounded-lg border transition-colors duration-300 overflow-hidden flex flex-col justify-between min-h-[320px] ${isUnlockable ? 'bg-surface border-outline hover:border-on-background/20 shadow-sm hover:shadow-md' : 'bg-surface-container-high border-transparent grayscale'}`}
                    >
                       <div className="space-y-6 relative z-10">
                          <div className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all duration-500 ${isUnlockable ? 'bg-surface-container-high text-on-background group-hover:bg-on-background group-hover:text-background' : 'bg-surface-container-high text-on-surface-subtle'}`}>
                             <Gift className="w-6 h-6" />
                          </div>
                          <div className="space-y-3">
                             <h4 className="text-2xl font-black text-on-background uppercase tracking-tight">{reward.nom}</h4>
                             <p className="font-body text-sm text-on-surface-variant leading-relaxed">{reward.description}</p>
                          </div>
                       </div>

                       <div className="space-y-6 relative z-10">
                          <div className="flex justify-between items-center border-t border-outline pt-6">
                             <span className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-widest">{reward.points_requis} pts</span>
                             {isUnlockable ? (
                                <button className="flex items-center gap-2 text-on-background font-sans text-[10px] font-black uppercase tracking-widest hover:translate-x-2 transition-all">
                                   En profiter <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                             ) : (
                                <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Verrouillé</span>
                             )}
                          </div>
                       </div>
                       
                       <div className="absolute inset-0 bg-on-background/[0.025] pointer-events-none" />
                    </motion.div>
                 );
              })}
           </div>
        </section>
      </main>
    </div>
  );
};
