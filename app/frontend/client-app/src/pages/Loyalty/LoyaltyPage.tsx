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
    <div className="flex-1 flex flex-col items-center justify-center bg-[#FAF9F6] relative overflow-hidden">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6 relative z-10"
        >
            <Loader2 className="w-12 h-12 animate-spin text-[#D14D1A]" strokeWidth={1.5}/>
            <span className="font-sans text-[9px] font-black text-[#2D2424]/40 uppercase tracking-[0.4em]">Chargement des privilèges</span>
        </motion.div>
        <div className="absolute inset-0 bg-[#C5A059]/5 blur-[100px] rounded-full" />
    </div>
  );

  return (
    <div className="flex-1 bg-background font-body selection:bg-primary/20 overflow-y-auto custom-scrollbar">
      <main className="max-w-7xl mx-auto px-client-margin py-12 md:py-24 space-y-20">
        
        {/* Hero Loyalty Status */}
        <section className="relative rounded-[3rem] overflow-hidden bg-[#2D2424] p-12 md:p-24 text-center shadow-2xl">
           <div className="absolute inset-0 opacity-10 mix-blend-overlay">
              <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover" alt="" />
           </div>
           
           <div className="relative z-10 space-y-12">
              <div className="space-y-4">
                 <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-sans text-[11px] font-black uppercase tracking-[0.5em] text-[#C5A059]"
                 >
                    PROGRAMME ÉCHELON
                 </motion.span>
                 <h1 className=" text-5xl md:text-7xl text-[#FAF9F6]  tracking-tighter leading-none m-0">Votre Fidélité <br/> <span className="not- uppercase font-black text-[#C5A059]">Récompensée.</span></h1>
              </div>

              <div className="max-w-xl mx-auto space-y-10">
                 <div className="flex justify-between items-end">
                    <div className="text-left">
                       <p className="font-sans text-[10px] font-black text-[#FAF9F6]/40 uppercase tracking-widest mb-1">Grade Actuel</p>
                       <div className="flex items-center gap-3">
                          <Award className="w-6 h-6 text-[#C5A059]" />
                          <span className=" text-3xl font-black  text-[#FAF9F6] tracking-tight">{loyalty?.tier_display}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="font-sans text-4xl font-black text-[#C5A059] tabular-nums">{loyalty?.points}</span>
                       <span className="font-sans text-[10px] font-black text-[#FAF9F6]/40 uppercase tracking-widest ml-3">Points Cumulés</span>
                    </div>
                 </div>

                 {/* Premium Progress Bar */}
                 <div className="space-y-4">
                    <div className="w-full h-2.5 bg-[#FAF9F6]/5 rounded-full overflow-hidden border border-white/5">
                       <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '65%' }}
                          transition={{ duration: 1.8, ease: [0.23, 1, 0.32, 1] }}
                          className="h-full bg-gradient-to-r from-[#C5A059] to-[#D14D1A] relative shadow-[0_0_20px_rgba(209,77,26,0.3)]"
                       />
                    </div>
                    <p className="font-body text-[13px] text-[#FAF9F6]/60 ">Bientôt le prochain échelon</p>
                 </div>
              </div>
           </div>
        </section>

        {/* Rewards Grid */}
        <section className="space-y-12">
           <div className="flex justify-between items-end border-b border-[#2D2424]/10 pb-6">
              <div>
                 <h2 className=" text-4xl font-black text-[#2D2424]  tracking-tighter m-0 uppercase">Vos Privilèges</h2>
                 <p className="font-sans text-[10px] font-black text-[#2D2424]/70 uppercase tracking-widest mt-2">Échangez vos points contre des attentions particulières</p>
              </div>
              <div className="flex items-center gap-3 text-[#2D2424]">
                 <Zap className="w-4 h-4 fill-current text-[#D14D1A]" />
                 <span className="font-sans text-[10px] font-black uppercase tracking-widest">Offres Exclusives</span>
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
                       className={`group relative p-8 rounded-[2.5rem] border transition-colors duration-700 overflow-hidden flex flex-col justify-between h-[400px] ${isUnlockable ? 'bg-[#FAF9F6] border-[#2D2424]/10 hover:border-[#C5A059]/40 shadow-xl hover:shadow-2xl' : 'bg-[#F4F1EA]/50 border-transparent grayscale'}`}
                    >
                       <div className="space-y-6 relative z-10">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isUnlockable ? 'bg-[#C5A059]/10 text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-[#FAF9F6]' : 'bg-[#2D2424]/5 text-[#2D2424]/20'}`}>
                             <Gift className="w-6 h-6" />
                          </div>
                          <div className="space-y-3">
                             <h4 className=" text-2xl font-black text-[#2D2424] uppercase  tracking-tight">{reward.nom}</h4>
                             <p className="font-body text-sm text-[#2D2424]/70 leading-relaxed ">{reward.description}</p>
                          </div>
                       </div>

                       <div className="space-y-6 relative z-10">
                          <div className="flex justify-between items-center border-t border-[#2D2424]/5 pt-6">
                             <span className="font-sans text-[11px] font-black text-[#C5A059] uppercase tracking-widest">{reward.points_requis} PTS</span>
                             {isUnlockable ? (
                                <button className="flex items-center gap-2 text-[#D14D1A] font-sans text-[10px] font-black uppercase tracking-widest hover:translate-x-2 transition-all">
                                   En profiter <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                             ) : (
                                <span className="font-sans text-[10px] font-black text-[#2D2424]/20 uppercase tracking-widest">Verrouillé</span>
                             )}
                          </div>
                       </div>
                       
                       <div className="absolute inset-0 bg-gradient-to-br from-[#C5A059]/5 to-transparent pointer-events-none" />
                    </motion.div>
                 );
              })}
           </div>
        </section>
      </main>
    </div>
  );
};
