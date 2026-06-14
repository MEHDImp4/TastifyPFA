import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { menuApi } from '../../api/menu';
import { useConfigStore } from '../../store/configStore';
import type { Plat } from '../../api/menu';

const heroContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as any,
    },
  },
};

export const PortalHomePage = () => {
  const [topDishes, setTopDishes] = useState<Plat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { config } = useConfigStore();

  useEffect(() => {
    const fetchTopDishes = async () => {
      try {
        const res = await menuApi.getTopRecommendations();
        setTopDishes(res.data);
      } catch (err) {
        console.error('Failed to fetch top dishes', err);
        setTopDishes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopDishes();
  }, []);

  return (
    <div className="page-shell text-on-background">
      
      {/* Simple Minimal Hero */}
      <section className="relative w-full flex flex-col justify-center border-b border-outline overflow-hidden">
        {/* Soft elegant glowing background to wow users */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(180,83,9,0.06),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-transparent pointer-events-none lg:block hidden" />
        
        <div className="max-w-[1200px] mx-auto w-full px-client-margin py-[--spacing-section-y-lg] grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 items-center relative z-10">
          <motion.div
             variants={heroContainerVariants}
             initial="hidden"
             animate="visible"
             className="lg:col-span-7 space-y-8"
          >
            <motion.div variants={heroItemVariants} className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Gastronomie Contemporaine</span>
            </motion.div>

            <motion.h1 variants={heroItemVariants} className="text-[clamp(2.75rem,8vw,5.5rem)] font-bold tracking-tight leading-[1.1] text-on-background">
              {config?.nom ? config.nom : "Tastify"} <br/>
              <span className="bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent">Cuisine de terroir.</span>
            </motion.h1>

            <motion.div variants={heroItemVariants} className="max-w-lg">
                <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed">
                   Une table marocaine contemporaine où chaque plat raconte une histoire de terroir et d'élégance simple.
                </p>
            </motion.div>

            <motion.div variants={heroItemVariants} className="flex flex-col sm:flex-row gap-4 pt-2 sm:pt-4">
                <Link
                  to="/menu"
                  className="btn-primary w-full sm:w-auto min-h-[48px] gap-3 px-8 group shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  Voir la Carte
                  <ArrowRight className="w-4 h-4 ml-auto sm:ml-0 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/reservations"
                  className="btn-secondary w-full sm:w-auto min-h-[48px] gap-3 px-8 group transition-all duration-300"
                >
                  <CalendarDays className="w-4 h-4 text-accent" />
                  Réserver une Table
                </Link>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-5 block"
          >
            <div className="relative group aspect-[16/11] sm:aspect-[4/5] max-h-[420px] lg:max-h-none bg-surface-container-high rounded-xl overflow-hidden border border-outline shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:border-accent/30">
                <img 
                    src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200"
                    alt="Table dressée dans une ambiance restaurant contemporaine"
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-full object-cover opacity-95 transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recommended Selection - Clean Grid */}
      <section className="page-section-lg">
        <div className="max-w-[1200px] mx-auto px-client-margin">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 md:mb-16 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-on-surface-variant">
                 <Sparkles className="w-4 h-4 text-accent" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Inspirations</span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight">Sélection du Chef</h3>
            </div>
            <Link to="/menu" className="min-h-11 inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-on-background border-b border-outline hover:border-accent hover:text-accent transition-all">
                Tout voir
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {isLoading ? [1, 2].map(i => (
               <div key={i} className="aspect-video bg-surface-container-high animate-pulse rounded-lg border border-outline" />
            )) : topDishes.length === 0 ? (
              <div className="col-span-full py-16 text-center text-on-surface-subtle">
                <p className="text-sm font-bold uppercase tracking-widest">Sélection indisponible pour le moment</p>
              </div>
            ) : topDishes.map((dish, idx) => (
              <motion.div 
                key={dish.id}
                initial={{ opacity: 0, y: 5 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="atelier-card p-6 flex flex-col h-full hover:border-accent/20 transition-all duration-300 hover:shadow-xl hover:shadow-black/[0.02]"
              >
                <div className="flex justify-between items-start mb-8">
                    <span className="font-mono text-xs text-on-surface-subtle">0{idx + 1}</span>
                    <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full border border-outline">
                        <TrendingUp className="w-3 h-3 text-success" />
                        <span className="text-caption font-bold uppercase tracking-widest">Tendance</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
                    <div className="lg:col-span-5">
                        <div className="aspect-square rounded-md overflow-hidden border border-outline">
                            {dish.image ? (
                                <img src={dish.image} className="w-full h-full object-cover" alt={dish.nom} loading="lazy" decoding="async" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-surface-container-high text-on-surface-subtle font-bold text-4xl">{dish.nom.charAt(0)}</div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-7 space-y-4">
                        <div>
                            <h4 className="text-lg font-bold tracking-tight">{dish.nom}</h4>
                            <p className="font-mono text-xs text-on-surface-variant">{config?.devise || 'DH'} {parseFloat(dish.prix).toFixed(0)}</p>
                        </div>

                        <div className="space-y-3">
                            {dish.top_avis && dish.top_avis.length > 0 && (
                                <div className="pl-4 border-l border-outline">
                                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                                        "{dish.top_avis[0].commentaire}"
                                    </p>
                                </div>
                            )}
                        </div>

                        <Link
                            to="/menu"
                            className="inline-flex min-h-11 items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent hover:text-amber-800 transition-colors border-b border-transparent hover:border-amber-800 pb-0.5"
                        >
                            Détails <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="page-section px-client-margin border-t border-outline">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-6 space-y-6">
                <Link to="/" className="inline-flex min-h-11 items-center">
                    <h2 className="text-2xl font-bold tracking-tighter">
                        {config?.nom || "tastify."}
                    </h2>
                </Link>
                <p className="text-sm text-on-surface-variant leading-relaxed max-w-sm">
                   Une hospitalité contemporaine, servie avec précision et simplicité au coeur de la ville.
                </p>
          </div>

          <div className="md:col-span-3 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Menu</span>
            <ul className="space-y-2">
              <li><Link to="/menu" className="inline-flex min-h-11 items-center text-xs text-on-surface-variant hover:text-on-background transition-colors">La Carte</Link></li>
              <li><Link to="/reservations" className="inline-flex min-h-11 items-center text-xs text-on-surface-variant hover:text-on-background transition-colors">Réservations</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-4 md:text-right">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Contact</span>
            <div className="space-y-2">
                <p className="text-xs text-on-surface-variant">
                  {config?.adresse || "Casablanca"}
                </p>
                {config?.telephone && <p className="text-sm font-mono">{config.telephone}</p>}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
