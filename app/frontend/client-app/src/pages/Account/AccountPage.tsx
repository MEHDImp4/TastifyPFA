import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import type { LoyaltyProfile, LoyaltyTransaction, Reward } from '../../api/loyalty';
import { loyaltyApi, toLoyaltyNumber } from '../../api/loyalty';
import type { Reservation } from '../../api/reservations';
import { reservationApi } from '../../api/reservations';
import { avisApi } from '../../api/avis';
import { commandesApi } from '../../api/commandes';
import type { Commande } from '../../api/commandes';
import { useAuthStore } from '../../store/authStore';
import { useConfigStore } from '../../store/configStore';
import { 
  Award, 
  ShieldCheck, 
  LogOut, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  MessageCircle,
  CheckCircle2,
  Loader2,
  Quote,
  Settings,
  ShoppingBag,
  History,
  Gift,
  User,
  MapPin,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

const getTierCardStyle = (tier?: string) => {
  const upper = tier?.toUpperCase() || 'GOLD';
  switch (upper) {
    case 'BRONZE':
      return {
        bg: 'bg-gradient-to-br from-[#5c3317] via-[#a75d3c] to-[#3a1d0b]',
        border: 'border-[#a75d3c]/40',
        text: 'text-amber-100',
        glow: 'bg-amber-500/10'
      };
    case 'SILVER':
    case 'ARGENT':
      return {
        bg: 'bg-gradient-to-br from-[#3E4A56] via-[#7B8B9B] to-[#1C2329]',
        border: 'border-[#7B8B9B]/40',
        text: 'text-slate-100',
        glow: 'bg-slate-400/10'
      };
    case 'GOLD':
    case 'OR':
      return {
        bg: 'bg-gradient-to-br from-[#4A320C] via-[#D9A752] to-[#251804]',
        border: 'border-[#D9A752]/40',
        text: 'text-yellow-100',
        glow: 'bg-yellow-500/10'
      };
    case 'PLATINUM':
    case 'PLATINE':
      return {
        bg: 'bg-gradient-to-br from-[#1C1F22] via-[#3E454C] to-[#0A0B0C]',
        border: 'border-white/10',
        text: 'text-neutral-100',
        glow: 'bg-white/5'
      };
    default:
      return {
        bg: 'bg-gradient-to-br from-[#4A320C] via-[#D9A752] to-[#251804]',
        border: 'border-[#D9A752]/40',
        text: 'text-yellow-100',
        glow: 'bg-yellow-500/10'
      };
  }
};

const getStatusColor = (status?: string) => {
  if (!status) return 'bg-surface-container border border-outline text-on-surface-subtle';
  const upper = status.toUpperCase();
  if (upper === 'PAYEE' || upper === 'CONFIRMEE' || upper === 'VALIDE') {
    return 'bg-success/10 text-success border border-success/20';
  }
  if (upper === 'EN_PREPARATION' || upper === 'EN_ATTENTE') {
    return 'bg-amber-500/10 text-amber-700 border border-amber-500/20';
  }
  if (upper === 'ANNULEE' || upper === 'REFUSEE') {
    return 'bg-error/10 text-error border border-error/20';
  }
  return 'bg-surface-container-high border border-outline text-on-surface-subtle';
};

export const AccountPage: React.FC = () => {
  const { username, logout } = useAuthStore();
  const { config } = useConfigStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'profile' | 'orders' | 'reservations') || 'profile';

  const [loyalty, setLoyalty] = useState<LoyaltyProfile | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  
  // Review state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Collapsible orders state
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

  const hasPaidOrders = orders.some(o => o.statut === 'PAYEE');
  useBodyScrollLock(isReviewModalOpen && hasPaidOrders);

  const fetchData = async () => {
    try {
      const [loyaltyRes, rewardsRes, transactionsRes, resRes, ordersRes] = await Promise.all([
        loyaltyApi.getMyStatus(),
        loyaltyApi.getRewards(),
        loyaltyApi.getTransactions(),
        reservationApi.getMyReservations().catch(() => ({ data: [] })),
        commandesApi.getMyOrders().catch(() => ({ data: [] }))
      ]);
      setLoyalty(loyaltyRes.data);
      setRewards(rewardsRes.data);
      setTransactions(transactionsRes.data);
      setReservations(resRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des données', err);
      toast.error('Données de compte indisponibles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPaidOrders) {
      toast.error("Vous devez avoir réglé une commande pour donner votre avis.");
      return;
    }
    if (comment.trim().length < 10) {
      setReviewError('Votre avis doit contenir au moins 10 caractères.');
      return;
    }
    setIsSubmitting(true);
    try {
      await avisApi.createAvis({ commentaire: comment });
      toast.success('Avis enregistré');
      setIsReviewModalOpen(false);
      setComment('');
      setReviewError('');
    } catch (err) {
      toast.error('Échec de l\'envoi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOrder = (orderId: number) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleTabChange = (tab: 'profile' | 'orders' | 'reservations') => {
    searchParams.set('tab', tab);
    setSearchParams(searchParams, { replace: true });
  };

  if (isLoading) return (
    <div className="page-shell flex flex-col items-center justify-center relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-6 relative z-10"
      >
        <Loader2 className="w-12 h-12 animate-spin text-on-background" strokeWidth={1.5}/>
        <span className="font-sans text-[10px] font-black text-on-surface-subtle uppercase tracking-[0.4em]">Chargement de votre espace</span>
      </motion.div>
      <div className="absolute inset-0 bg-on-background/5 blur-[100px] rounded-full" />
    </div>
  );

  const cardStyle = getTierCardStyle(loyalty?.tier);

  return (
    <div className="page-shell bg-background min-h-screen">
      <main className="max-w-6xl mx-auto px-client-margin py-8 sm:py-12 md:py-16 space-y-12">
        
        {/* Profile Card & Membership Card Header */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: User Avatar & Information */}
          <div className="lg:col-span-6 bg-surface border border-outline rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 shadow-premium relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
            
            <div className="w-24 h-24 rounded-full border border-outline bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0 shadow-md relative">
              <img 
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=300" 
                className="w-full h-full object-cover grayscale-[0.2] transition-transform duration-700 group-hover:scale-105" 
                alt="Avatar client" 
                loading="lazy" 
                decoding="async" 
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-3 z-10">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-on-background tracking-tight m-0 uppercase font-heading">{username}</h1>
                <span className="text-[10px] font-bold text-accent tracking-[0.25em] uppercase block mt-1">Espace client</span>
              </div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                <div className="bg-surface-container-high border border-outline px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <Award className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[8px] font-extrabold text-on-background uppercase tracking-widest">{loyalty?.tier_display || loyalty?.tier || 'Membre'}</span>
                </div>
                <div className="bg-surface-container-high border border-outline px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  <span className="text-[8px] font-extrabold text-on-background uppercase tracking-widest">{loyalty?.points || 0} pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Virtual glowing 3D-effect Loyalty Card */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div className={`relative w-full max-w-[420px] aspect-[1.586/1] rounded-2xl ${cardStyle.bg} ${cardStyle.border} border p-6 flex flex-col justify-between text-white shadow-premium-lg relative overflow-hidden group select-none transition-transform duration-500 hover:-translate-y-1`}>
              
              {/* Metallic reflection overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s] ease-out pointer-events-none" />
              <div className={`absolute -right-16 -top-16 w-48 h-48 ${cardStyle.glow} rounded-full blur-3xl pointer-events-none`} />

              {/* Card Header */}
              <div className="flex justify-between items-start relative z-10">
                <span className="text-base font-bold font-heading tracking-widest uppercase">
                  {config?.nom || "tastify."}
                </span>
                
                {/* Visual Golden Chip */}
                <div className="w-9 h-7 rounded-md bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border border-amber-500/20 shadow-inner flex flex-col justify-between p-1.5 relative overflow-hidden">
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-amber-800/30" />
                  <div className="absolute inset-y-0 left-1/2 w-[1px] bg-amber-800/30" />
                  <div className="w-full h-full border border-amber-800/20 rounded-[2px]" />
                </div>
              </div>

              {/* Card Body */}
              <div className="text-left relative z-10 pt-2">
                <p className="text-[9px] font-bold text-white/50 uppercase tracking-[0.3em]">Statut fidélité</p>
                <p className="text-2xl font-bold tracking-[0.12em] uppercase font-sans mt-0.5">
                  {loyalty?.tier_display || loyalty?.tier || 'MEMBRE'}
                </p>
              </div>

              {/* Card Footer */}
              <div className="flex justify-between items-end relative z-10 border-t border-white/10 pt-4">
                <div className="text-left">
                  <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-white/50">Titulaire</span>
                  <p className="text-xs font-semibold uppercase tracking-wider mt-0.5 truncate max-w-[180px]">{username}</p>
                </div>
                <div className="text-right">
                  <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-white/50">Points</span>
                  <div className="flex items-baseline justify-end gap-0.5 mt-0.5">
                    <span className="font-mono text-lg font-bold leading-none tabular-nums">{loyalty?.points || 0}</span>
                    <span className="text-[8px] font-bold text-white/70 uppercase">pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Selection Navigation */}
        <section className="border-b border-outline/50">
          <div className="flex justify-center sm:justify-start gap-6 overflow-x-auto no-scrollbar py-2">
            {[
              { id: 'profile', label: 'Mon profil & privilèges', icon: User },
              { id: 'orders', label: `Mes commandes (${orders.length})`, icon: ShoppingBag },
              { id: 'reservations', label: `Mes réservations (${reservations.length})`, icon: Calendar }
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`relative min-h-[44px] px-3 py-2 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 transition-colors duration-300 ${
                    isSelected ? 'text-primary' : 'text-on-surface-subtle hover:text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {isSelected && (
                    <motion.div
                      layoutId="activeAccountTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Tab Contents */}
        <div className="min-h-[40vh]">
          <AnimatePresence mode="wait">
            
            {/* Tab 1: Profile & Loyalty Overview */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-10 text-left"
              >
                
                {/* Left: Privilege Rewards Shop (8 cols) */}
                <div className="lg:col-span-8 space-y-10">
                  <div className="space-y-6">
                    <div className="border-b border-outline/50 pb-4">
                      <h3 className="text-xl font-bold tracking-tight lowercase font-heading">avantages disponibles.</h3>
                      <p className="text-xs text-on-surface-muted mt-1 leading-relaxed">Échangez vos points contre des privilèges exclusifs lors de votre prochain passage.</p>
                    </div>

                    {rewards.length === 0 ? (
                      <div className="py-16 text-center border border-dashed border-outline rounded-2xl bg-surface/50">
                        <Gift className="w-10 h-10 mx-auto mb-3 text-on-surface-subtle" strokeWidth={1.5} />
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-subtle">Aucune récompense disponible</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {rewards.map((reward) => {
                          const isUnlockable = toLoyaltyNumber(loyalty?.points) >= toLoyaltyNumber(reward.points_requis);
                          const isRedeeming = redeemingId === reward.id;
                          return (
                            <div 
                              key={reward.id}
                              className={`p-5 rounded-2xl border flex flex-col justify-between min-h-[220px] shadow-premium transition-all duration-300 ${
                                isUnlockable 
                                  ? 'bg-surface border-outline hover:border-accent/40 hover:-translate-y-0.5' 
                                  : 'bg-surface-container-high/40 border-transparent/10 grayscale opacity-60'
                              }`}
                            >
                              <div className="space-y-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUnlockable ? 'bg-accent/10 text-accent' : 'bg-surface-container-high/60 text-on-surface-subtle'}`}>
                                  <Gift className="w-5 h-5" />
                                </div>
                                <div className="space-y-1.5">
                                  <h4 className="text-base font-bold text-on-background leading-snug">{reward.nom}</h4>
                                  <p className="text-xs text-on-surface-muted leading-relaxed line-clamp-3 font-normal">{reward.description}</p>
                                </div>
                              </div>
                              <div className="flex justify-between items-center border-t border-outline/50 pt-4 mt-4">
                                <span className="font-mono text-xs font-semibold text-accent">{reward.points_requis} pts</span>
                                {isUnlockable ? (
                                  <button
                                    onClick={() => handleRedeem(reward)}
                                    disabled={isRedeeming}
                                    className="min-h-[36px] px-3 text-on-background font-bold text-[9px] uppercase tracking-[0.2em] flex items-center gap-1 rounded-lg hover:text-accent transition-colors disabled:opacity-50"
                                  >
                                    {isRedeeming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><span>Profiter</span> <ChevronRight className="w-3.5 h-3.5" /></>}
                                  </button>
                                ) : (
                                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-on-surface-subtle">Verrouillé</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Point History Log */}
                  <div className="space-y-6">
                    <div className="border-b border-outline/50 pb-4 flex justify-between items-end">
                      <div>
                        <h3 className="text-xl font-bold tracking-tight lowercase font-heading">historique des points.</h3>
                        <p className="text-xs text-on-surface-muted mt-1 leading-relaxed font-normal">Suivi des points gagnés et dépensés lors de vos activités.</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface-subtle">
                        <History className="w-4 h-4" />
                        <span className="text-[8px] font-bold tracking-widest uppercase">Mouvements</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {transactions.length > 0 ? transactions.slice(0, 5).map(tx => (
                        <div key={tx.id} className="p-4 bg-surface border border-outline rounded-2xl flex items-center justify-between gap-4 shadow-premium hover:border-outline-variant/60 transition-colors duration-300">
                          <div>
                            <h4 className="text-sm font-semibold text-on-background">{tx.description}</h4>
                            <p className="text-[9px] text-on-surface-subtle mt-0.5 tracking-wider uppercase font-medium">
                              {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          <span className={`font-mono text-sm font-bold ${tx.type === 'GAIN' ? 'text-success' : 'text-error'}`}>
                            {tx.type === 'GAIN' ? '+' : ''}{Number(tx.points).toFixed(2)} pts
                          </span>
                        </div>
                      )) : (
                        <div className="py-12 text-center border border-dashed border-outline rounded-xl bg-surface/50">
                          <History className="w-8 h-8 mx-auto mb-2 text-on-surface-subtle" strokeWidth={1.5} />
                          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-subtle">Aucun mouvement de points</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Actions Menu & Reviews (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Account panel options */}
                  <div className="bg-[#1E1111] text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-premium relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-[50px] -mr-24 -mt-24 pointer-events-none" />
                    
                    <div className="space-y-1 relative z-10">
                      <span className="text-[8px] font-bold tracking-[0.25em] text-amber-400 uppercase">Paramètres</span>
                      <h3 className="text-lg font-bold tracking-tight text-white font-heading m-0">Gérer mon espace.</h3>
                    </div>

                    <div className="space-y-1.5 relative z-10">
                      {[
                        { icon: Settings, label: 'Paramètres du Profil', action: () => toast.info('Gestion de profil bientôt disponible') },
                        { icon: MessageCircle, label: 'Laisser un avis', action: () => setIsReviewModalOpen(true), highlight: hasPaidOrders }
                      ].map((item, i) => (
                        <button
                          key={i} onClick={item.action}
                          disabled={item.highlight === false}
                          className={`w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl transition-all duration-300 group ${
                            item.highlight === false ? 'opacity-35 cursor-not-allowed' : 'hover:bg-white/5 text-white/90 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={2} />
                            <span className="text-xs font-semibold tracking-wider uppercase">{item.label}</span>
                          </div>
                          {item.highlight !== false && <ChevronRight className="w-4 h-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:translate-x-0.5 transition-all" />}
                        </button>
                      ))}
                    </div>

                    <div className="pt-5 border-t border-white/10 relative z-10">
                      <button 
                        onClick={() => void logout()} 
                        className="w-full min-h-[44px] flex items-center gap-3 text-white/90 p-3 rounded-xl hover:bg-white/10 hover:text-white transition-all font-semibold text-xs tracking-wider uppercase"
                      >
                        <LogOut className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={2} />
                        <span>Fermer la session</span>
                      </button>
                    </div>
                  </div>

                  {/* Review warning panel */}
                  {!hasPaidOrders && (
                    <div className="p-5 bg-accent/5 border border-accent/20 rounded-2xl flex items-start gap-4">
                      <CheckCircle2 className="w-6 h-6 text-accent shrink-0 mt-0.5" strokeWidth={1.5} />
                      <p className="text-xs text-on-surface-muted leading-relaxed font-medium">
                        Le partage d'avis est réservé aux clients ayant déjà consommé et réglé une commande au restaurant.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Tab 2: Orders List */}
            {activeTab === 'orders' && (
              <motion.div
                key="orders-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 text-left"
              >
                <div className="border-b border-outline/50 pb-4">
                  <h3 className="text-xl font-bold tracking-tight lowercase font-heading">suivi des commandes.</h3>
                  <p className="text-xs text-on-surface-muted mt-1 leading-relaxed">Consultez l'historique et les détails de vos commandes.</p>
                </div>

                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const isExpanded = expandedOrders[order.id];
                      return (
                        <div 
                          key={order.id}
                          className="bg-surface border border-outline rounded-2xl p-5 shadow-premium group transition-all duration-300 hover:border-accent/30"
                        >
                          <div 
                            onClick={() => toggleOrder(order.id)}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center text-accent border border-outline transition-colors duration-500 group-hover:bg-accent group-hover:text-background shrink-0">
                                <ShoppingBag className="w-5 h-5" strokeWidth={2} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2.5">
                                  <h4 className="text-base font-bold tracking-tight text-on-background">Commande #{order.id}</h4>
                                  <span className="text-[10px] font-bold text-on-surface-subtle font-mono uppercase bg-surface-container-high px-2 py-0.5 rounded border border-outline/50">
                                    {order.type}
                                  </span>
                                </div>
                                <p className="text-xs text-on-surface-muted mt-1 font-medium">
                                  {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • <span className="font-semibold text-accent font-mono">{parseFloat(order.montant_total).toFixed(0)} DH</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 self-end sm:self-auto">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${getStatusColor(order.statut)}`}>
                                {order.statut}
                              </span>
                              <div className="text-on-surface-subtle hover:text-on-background transition-colors p-1.5 rounded-full hover:bg-surface-container-high">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>
                          </div>

                          {/* Collapsible Order items details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="mt-5 pt-5 border-t border-outline/50 pl-2 sm:pl-16 space-y-4 text-left">
                                  <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                                    <h5 className="text-[9px] font-bold text-accent uppercase tracking-[0.25em]">Détail des plats</h5>
                                  </div>
                                  
                                  <div className="divide-y divide-outline/40">
                                    {order.lignes && order.lignes.length > 0 ? (
                                      order.lignes.map((ligne) => (
                                        <div key={ligne.id} className="py-3 flex justify-between items-center text-xs font-semibold text-on-surface-muted">
                                          <div className="flex items-baseline gap-2">
                                            <span className="text-on-background font-bold">{ligne.plat_nom}</span>
                                            <span className="text-[10px] text-on-surface-subtle font-normal font-mono bg-surface-container-high px-1.5 py-0.5 rounded border border-outline/40">
                                              x{ligne.quantite}
                                            </span>
                                          </div>
                                          <span className="font-mono text-on-surface">
                                            {(parseFloat(ligne.prix_unitaire) * ligne.quantite).toFixed(0)} DH
                                          </span>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-xs text-on-surface-subtle py-2 font-normal italic">Aucun détail disponible pour cette commande.</p>
                                    )}
                                  </div>

                                  <div className="pt-2 flex justify-between items-center text-xs border-t border-outline/40">
                                    <span className="text-on-surface-subtle font-medium">Total facturé</span>
                                    <span className="font-mono font-bold text-primary text-sm">{parseFloat(order.montant_total).toFixed(0)} DH</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-20 text-center border border-dashed border-outline rounded-3xl bg-surface/40 flex flex-col items-center justify-center gap-6">
                    <div className="w-14 h-14 bg-surface-container-high rounded-full flex items-center justify-center text-on-surface-subtle border border-outline">
                      <ShoppingBag className="w-6 h-6 text-accent" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold text-on-background lowercase font-heading">Aucune commande enregistrée.</h4>
                      <p className="text-xs text-on-surface-muted max-w-xs mx-auto leading-relaxed font-normal">Commandez directement depuis notre carte pour savourer nos mets.</p>
                    </div>
                    <Link to="/menu" className="btn-primary min-h-[44px] px-8 text-white">Consulter la carte</Link>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab 3: Reservations List */}
            {activeTab === 'reservations' && (
              <motion.div
                key="reservations-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 text-left"
              >
                <div className="border-b border-outline/50 pb-4">
                  <h3 className="text-xl font-bold tracking-tight lowercase font-heading">mes réservations de table.</h3>
                  <p className="text-xs text-on-surface-muted mt-1 leading-relaxed">Consultez et suivez l'état de vos réservations de table.</p>
                </div>

                {reservations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reservations.map((res, idx) => {
                      const isFuture = new Date(res.date_reservation) >= new Date(new Date().setHours(0,0,0,0));
                      return (
                        <div 
                          key={idx} 
                          className="p-5 bg-surface border border-outline rounded-2xl flex flex-col justify-between min-h-[180px] shadow-premium hover:border-accent/30 transition-all duration-300"
                        >
                          <div className="space-y-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center text-accent border border-outline shrink-0">
                                  <Calendar className="w-5 h-5" strokeWidth={2} />
                                </div>
                                <div className="text-left">
                                  <h4 className="text-base font-bold tracking-tight text-on-background">
                                    {new Date(res.date_reservation).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
                                  </h4>
                                  <div className="flex items-center gap-1.5 text-xs text-on-surface-subtle font-medium mt-0.5">
                                    <Clock className="w-3.5 h-3.5 text-accent" />
                                    <span>{res.heure_debut}</span>
                                  </div>
                                </div>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-[8px] font-extrabold uppercase tracking-widest ${getStatusColor(res.statut)}`}>
                                {res.statut || 'En attente'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-dashed border-outline-variant/60 pt-4 text-xs font-semibold text-on-surface-muted">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-on-surface-subtle font-normal">Table :</span>
                                <span className="text-on-background">#{res.table}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-on-surface-subtle font-normal">Couverts :</span>
                                <span className="text-on-background font-mono">{res.nombre_personnes} pers</span>
                              </div>
                            </div>

                            {res.notes && (
                              <div className="bg-surface-container-high/60 border border-outline/50 p-3 rounded-lg text-[11px] text-on-surface-muted leading-relaxed font-normal">
                                <p className="font-semibold text-[9px] uppercase tracking-wider text-on-surface-subtle mb-1">Note particulière :</p>
                                "{res.notes}"
                              </div>
                            )}
                          </div>

                          {isFuture && res.statut && res.statut.toUpperCase() !== 'ANNULEE' && (
                            <div className="flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-widest text-success bg-success/5 border border-success/15 px-3 py-1.5 rounded-lg mt-4 self-start">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-success" />
                              <span>Réservation à venir</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-20 text-center border border-dashed border-outline rounded-3xl bg-surface/40 flex flex-col items-center justify-center gap-6">
                    <div className="w-14 h-14 bg-surface-container-high rounded-full flex items-center justify-center text-on-surface-subtle border border-outline">
                      <Calendar className="w-6 h-6 text-accent" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold text-on-background lowercase font-heading">Aucune table réservée.</h4>
                      <p className="text-xs text-on-surface-muted max-w-xs mx-auto leading-relaxed font-normal">Prenez place dans notre restaurant et réservez une table.</p>
                    </div>
                    <Link to="/reservations" className="btn-primary min-h-[44px] px-8 text-white">Réserver une table</Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Unified Review Modal */}
        <AnimatePresence>
          {isReviewModalOpen && hasPaidOrders && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/95 backdrop-blur-md" onClick={() => setIsReviewModalOpen(false)} />
              <motion.div role="dialog" aria-modal="true" aria-labelledby="review-dialog-title" initial={{ opacity: 0, scale: 0.96, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 15 }} className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto custom-scrollbar bg-surface border border-outline rounded-3xl p-6 sm:p-8 md:p-10 shadow-premium-lg flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center text-accent mb-8 border border-outline">
                  <Quote className="w-6 h-6" strokeWidth={2} />
                </div>
                <h3 id="review-dialog-title" className="text-2xl font-bold text-on-background font-heading tracking-tight mb-2 lowercase">donner votre avis.</h3>
                <p className="text-on-surface-muted text-xs mb-8">Partagez votre avis sur les plats dégustés lors de votre repas.</p>
                
                <form onSubmit={handleReviewSubmit} noValidate className="w-full space-y-5">
                  <label htmlFor="review-comment" className="sr-only">Votre avis</label>
                  <textarea 
                    id="review-comment"
                    required
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      if (reviewError) setReviewError('');
                    }}
                    aria-invalid={Boolean(reviewError)}
                    aria-describedby={reviewError ? 'review-comment-error' : undefined}
                    className="field-control w-full p-4 rounded-xl text-sm resize-none h-40 placeholder:text-on-surface-subtle"
                    placeholder="Écrivez ici (minimum 10 caractères)..."
                  />
                  {reviewError && (
                    <p id="review-comment-error" role="alert" className="form-error text-left text-xs">
                      {reviewError}
                    </p>
                  )}

                  <button disabled={isSubmitting} type="submit" className="btn-primary w-full h-12 shadow-sm flex items-center justify-center text-white">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin text-on-primary" /> : <span>Transmettre mon avis</span>}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
};
