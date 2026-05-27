import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { loyaltyApi } from '../../api/loyalty';
import type { LoyaltyProfile, Reward } from '../../api/loyalty';
import { 
  Award, 
  Trophy, 
  History, 
  CheckCircle2, 
  Lock, 
  Loader2, 
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

export const LoyaltyPage: React.FC = () => {
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [profRes, rewRes] = await Promise.all([
        loyaltyApi.getMyStatus(),
        loyaltyApi.getRewards()
      ]);
      setProfile(profRes.data);
      setRewards(rewRes.data);
    } catch (err) {
      console.error('Failed to fetch loyalty data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRedeem = async (rewardId: number) => {
    setIsRedeeming(rewardId);
    try {
      await loyaltyApi.redeemReward(rewardId);
      toast.success('Reward Unlocked. Verification token sent.');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Redemption failed');
    } finally {
      setIsRedeeming(null);
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
            <span className="font-sans text-[9px] font-black text-[#2D2424]/40 uppercase tracking-[0.4em]">Chargement des privilèges</span>
        </motion.div>
        <div className="absolute inset-0 bg-[#C5A059]/5 blur-[100px] rounded-full" />
    </div>
  );

  const nextTierPoints = 1500;
  const progress = Math.min(((profile?.points || 0) / nextTierPoints) * 100, 100);

  return (
    <div className="flex-1 bg-background font-body selection:bg-primary/20 overflow-y-auto custom-scrollbar">
      <main className="max-w-6xl mx-auto px-client-margin py-12 md:py-24 space-y-12">
        
        {/* Membership Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
           <div className="lg:col-span-7 bg-surface-container border border-outline-variant rounded-3xl p-8 md:p-12 flex flex-col justify-between relative overflow-hidden group shadow-xl">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-[2000ms]">
                 <Award className="w-48 h-48 text-primary" />
              </div>
              
              <div className="relative z-10 space-y-8">
                 <div>
                    <span className="editorial-kicker mb-3">MEMBERSHIP STATUS</span>
                    <h1 className="font-serif text-4xl md:text-7xl font-black text-primary italic leading-none m-0 tabular-nums">
                       {profile?.points.toLocaleString() || 0} <span className="font-sans text-xl md:text-3xl text-on-surface-variant non-italic">PTS</span>
                    </h1>
                 </div>
                 <p className="text-lg md:text-xl text-on-surface-variant italic max-w-md uppercase tracking-tight">
                    You are approaching the next echelon. Only {nextTierPoints - (profile?.points || 0)} points until you unlock exclusive Gold privileges.
                 </p>
              </div>

              <div className="mt-12 relative z-10 space-y-4">
                 <div className="flex justify-between font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">
                    <span>SILVER TIER</span>
                    <span className="text-primary">GOLD STATUS</span>
                 </div>
                 <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant/30">
                    <motion.div 
                      initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-primary shadow-[0_0_20px_rgba(255,183,133,0.3)]" 
                    />
                 </div>
                 <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="font-sans text-[9px] font-black uppercase tracking-[0.3em]">Priority Table Allocation Active</span>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-5 bg-surface-container-high border border-outline-variant rounded-3xl p-8 md:p-12 flex flex-col gap-10 justify-center shadow-lg relative overflow-hidden">
              <div className="flex items-center gap-6 relative z-10">
                 <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-2xl shadow-primary/20">
                    <Trophy className="w-10 h-10" strokeWidth={1.5} />
                 </div>
                 <div>
                    <h3 className="font-serif text-2xl font-black text-on-surface uppercase italic tracking-tight m-0">Echelon Gold</h3>
                    <p className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mt-2">Member since Oct 2023</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 relative z-10">
                 <div className="p-4 bg-background border border-outline-variant rounded-2xl">
                    <p className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Total Visits</p>
                    <p className="font-serif text-3xl font-black text-on-surface italic">24</p>
                 </div>
                 <div className="p-4 bg-background border border-outline-variant rounded-2xl">
                    <p className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Redeemed</p>
                    <p className="font-serif text-3xl font-black text-on-surface italic">06</p>
                 </div>
              </div>

              <button className="w-full py-6 bg-on-surface text-background rounded-2xl font-sans text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:bg-primary shadow-2xl relative z-10">Digital Member Card</button>
              
              <div className="absolute inset-0 bg-primary/5 opacity-40 pointer-events-none" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
           </div>
        </section>

        {/* Redeemable Catalog */}
        <section className="space-y-10">
           <div className="flex justify-between items-end border-b border-outline-variant/30 pb-6">
              <div>
                 <span className="editorial-kicker mb-2 block">CATALOG</span>
                 <h2 className="font-serif text-3xl md:text-5xl font-black text-on-surface uppercase italic tracking-tighter m-0">Redeemable Rewards</h2>
              </div>
              <button className="font-sans text-[10px] font-black text-primary hover:text-on-surface uppercase tracking-widest transition-colors">View All</button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rewards.map((reward) => {
                const isLocked = (profile?.points || 0) < reward.points_requis;
                return (
                  <motion.div 
                    key={reward.id} whileHover={{ y: -5 }}
                    className={`bg-surface-container-low border-2 rounded-[2rem] p-4 flex flex-col gap-6 transition-all duration-700 ${isLocked ? 'border-outline-variant/30 grayscale' : 'border-outline-variant hover:border-primary shadow-lg'}`}
                  >
                     <div className="relative aspect-video rounded-2xl overflow-hidden bg-surface-container-highest border border-outline-variant/30">
                        {reward.image ? (
                          <img src={reward.image} className="w-full h-full object-cover" alt={reward.nom} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-serif italic text-4xl text-on-surface-variant/10">R</div>
                        )}
                        <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md border border-outline-variant/30 px-3 py-1 rounded-lg font-sans text-[11px] font-black text-primary tabular-nums">
                           {reward.points_requis} PTS
                        </div>
                        {isLocked && <div className="absolute inset-0 bg-background/40 flex items-center justify-center"><Lock className="w-8 h-8 text-on-surface-variant" /></div>}
                     </div>

                     <div className="px-2 flex-1 flex flex-col gap-2">
                        <h4 className="font-serif text-xl font-black text-on-surface uppercase tracking-tight m-0">{reward.nom}</h4>
                        <p className="font-body text-sm text-on-surface-variant italic uppercase tracking-tight">{reward.description || 'Exclusive culinary experience available for distinguished members.'}</p>
                     </div>

                     <button 
                       onClick={() => handleRedeem(reward.id)}
                       disabled={isLocked || isRedeeming === reward.id}
                       className={`w-full py-5 rounded-2xl font-sans text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${isLocked ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-primary hover:text-on-primary hover:border-primary shadow-xl shadow-black/20'}`}
                     >
                        {isRedeeming === reward.id ? <Loader2 className="w-4 h-4 animate-spin" /> : isLocked ? 'LOCKED' : <><span>Redeem Now</span><ArrowRight className="w-4 h-4" /></>}
                     </button>
                  </motion.div>
                );
              })}
           </div>
        </section>

        {/* Tier Perks Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-surface-container border border-outline-variant rounded-3xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-8 border-b border-outline-variant/30 bg-surface-container-high flex justify-between items-center">
                 <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.3em]">Recent Point History</h3>
                 <History className="w-4 h-4 text-on-surface-variant" />
              </div>
              <div className="flex-1 overflow-x-auto p-4">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest bg-surface-container-highest/20">
                          <th className="p-4">Temporal</th>
                          <th className="p-4">Description</th>
                          <th className="p-4 text-right">Delta</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 font-sans text-[11px] font-bold text-on-surface">
                       {[1, 2, 3].map((_, i) => (
                         <tr key={i} className="hover:bg-surface-container-low transition-colors">
                            <td className="p-4 uppercase text-on-surface-variant">MAR 14, 2024</td>
                            <td className="p-4">
                               <span className="uppercase block">Dinner Reservation</span>
                               <span className="font-mono text-[8px] text-on-surface-variant uppercase">Session #TS-88421</span>
                            </td>
                            <td className="p-4 text-right text-primary">+ 145</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           <div className="bg-surface-container border border-outline-variant rounded-3xl p-8 space-y-10 shadow-sm relative overflow-hidden">
              <h3 className="font-serif text-xl font-black text-primary uppercase italic tracking-tight border-b border-outline-variant/30 pb-4 relative z-10 flex items-center gap-3">
                 <Zap className="w-5 h-5 fill-current" /> Silver Perks
              </h3>
              <ul className="space-y-6 relative z-10">
                 {[
                    { label: "Welcome Amuse", desc: "Valid for every session." },
                    { label: "1.2x Multiplier", desc: "Accelerated point harvesting." },
                    { label: "Birthday Gesture", desc: "Curated gift from pastry." }
                 ].map((p, i) => (
                    <li key={i} className="flex gap-4 items-start">
                       <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                       <div>
                          <p className="font-sans text-[11px] font-black text-on-surface uppercase tracking-tight">{p.label}</p>
                          <p className="font-body text-[13px] text-on-surface-variant italic leading-none mt-1">{p.desc}</p>
                       </div>
                    </li>
                 ))}
                 <li className="flex gap-4 items-start text-on-surface-variant">
                    <Lock className="w-5 h-5 text-on-surface-variant shrink-0" />
                    <div>
                       <p className="font-sans text-[11px] font-black text-on-surface uppercase tracking-tight">Valet Access</p>
                       <p className="font-body text-[13px] text-on-surface-variant italic leading-none mt-1">Available for Gold tier.</p>
                    </div>
                 </li>
              </ul>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
           </div>
        </section>
      </main>
    </div>
  );
};
