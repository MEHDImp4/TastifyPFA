import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  History, 
  Star, 
  Loader2, 
  AlertCircle,
  Coins
} from 'lucide-react';
import axiosInstance from '@shared/auth/axiosInstance';
import TierBadge from '@shared/ui/TierBadge';
import { LoyaltyProfile, Reward, LoyaltyTransaction } from '@shared/types/loyalty';

const LoyaltyPage: React.FC = () => {
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, rewardsRes, transRes] = await Promise.all([
        axiosInstance.get('/loyalty/my_status/'),
        axiosInstance.get('/rewards/'),
        axiosInstance.get('/loyalty/transactions/')
      ]);
      setProfile(profileRes.data);
      setRewards(rewardsRes.data);
      setTransactions(transRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
      setError('Impossible de charger vos données de fidélité. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRedeem = async (reward: Reward) => {
    if (redeemingId) return;
    
    setRedeemingId(reward.id);
    try {
      await axiosInstance.post(`/rewards/${reward.id}/redeem/`);
      // Refresh data after successful redemption
      await fetchData();
    } catch (err: any) {
      console.error('Redemption failed:', err);
      alert(err.response?.data?.detail || 'Une erreur est survenue lors de l\'échange.');
    } finally {
      setRedeemingId(null);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Oups !</h2>
        <p className="text-foreground-muted mb-6">{error}</p>
        <button 
          onClick={fetchData}
          className="rounded-lg bg-teal px-6 py-2 font-bold uppercase tracking-wider text-white"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const points = parseFloat(profile?.points || '0');
  const nextTierPoints = points < 500 ? 500 : points < 1500 ? 1500 : 0;
  const progress = nextTierPoints > 0 ? (points / nextTierPoints) * 100 : 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-6xl px-6 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Programme de Fidélité</h1>
        <p className="text-foreground-muted">Gagnez des points à chaque repas et profitez de récompenses exclusives.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-8">
          <section className="relative overflow-hidden rounded-2xl bg-surface p-8 border border-white/5 shadow-xl">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-teal/10 blur-3xl" />
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal mb-2 block">Votre Solde</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black">{Math.floor(points)}</span>
                  <span className="text-xl font-bold text-foreground-muted uppercase tracking-widest">Points</span>
                </div>
              </div>
              
              <div className="flex flex-col items-start md:items-end gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-foreground-muted">Rang actuel</span>
                <TierBadge tier={profile?.tier || 'BRONZE'} className="scale-125 origin-right" />
              </div>
            </div>

            {nextTierPoints > 0 && (
              <div className="mt-10 space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-foreground-muted">Progression vers le prochain rang</span>
                  <span className="text-teal">{Math.floor(nextTierPoints - points)} points restants</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-teal to-teal/60"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Rewards Section */}
          <section>
            <div className="mb-6 flex items-center gap-3">
              <Gift className="h-6 w-6 text-teal" />
              <h2 className="text-xl font-bold">Récompenses disponibles</h2>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {rewards.length > 0 ? (
                  rewards.map((reward) => (
                    <motion.div 
                      key={reward.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group rounded-xl bg-surface border border-white/5 p-5 transition-all hover:border-teal/30 hover:shadow-lg hover:shadow-teal/5"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div className="rounded-lg bg-teal/10 p-2 text-teal">
                          <Star className="h-5 w-5" />
                        </div>
                        <div className="text-right">
                          <span className="block text-sm font-bold text-teal">{Math.floor(parseFloat(reward.points_requis))} pts</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Requis</span>
                        </div>
                      </div>
                      
                      <h3 className="mb-1 font-bold">{reward.nom}</h3>
                      <p className="mb-6 text-xs text-foreground-muted line-clamp-2">{reward.description}</p>
                      
                      <button 
                        onClick={() => handleRedeem(reward)}
                        disabled={points < parseFloat(reward.points_requis) || redeemingId === reward.id}
                        className={`w-full rounded-lg py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] transition-all
                          ${points >= parseFloat(reward.points_requis)
                            ? 'bg-teal text-white hover:bg-teal/90 active:scale-[0.98]' 
                            : 'bg-white/5 text-foreground-muted cursor-not-allowed'
                          }
                          flex items-center justify-center gap-2
                        `}
                      >
                        {redeemingId === reward.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Échanger'
                        )}
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full rounded-xl bg-surface border border-dashed border-white/10 p-12 text-center">
                    <p className="text-foreground-muted text-sm italic">Aucune récompense n'est configurée pour le moment.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Sidebar: History */}
        <section className="lg:col-span-1">
          <div className="mb-6 flex items-center gap-3">
            <History className="h-6 w-6 text-teal" />
            <h2 className="text-xl font-bold">Historique</h2>
          </div>
          
          <div className="rounded-2xl bg-surface border border-white/5 overflow-hidden">
            {transactions.length > 0 ? (
              <div className="divide-y divide-white/5">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                        {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className={`text-sm font-bold ${parseFloat(tx.points) >= 0 ? 'text-teal' : 'text-orange'}`}>
                      {parseFloat(tx.points) >= 0 ? '+' : ''}{Math.floor(parseFloat(tx.points))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Coins className="mx-auto h-8 w-8 text-white/10 mb-3" />
                <p className="text-xs text-foreground-muted">Aucune transaction trouvée.</p>
              </div>
            )}
            
            {transactions.length > 0 && (
              <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                <button className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted hover:text-teal transition-colors">
                  Voir tout l'historique
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default LoyaltyPage;
