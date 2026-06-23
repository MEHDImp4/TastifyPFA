import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { menuApi } from '../../api/menu';
import { useConfigStore } from '../../store/configStore';
import type { Plat } from '../../api/menu';

const HERO_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200",
    label: "Atmosphère",
    desc: "Une élégance marocaine contemporaine"
  },
  {
    src: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&q=80&w=1200",
    label: "Tradition",
    desc: "L'art du tajine mijoté lentement"
  },
  {
    src: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200",
    label: "Gourmandise",
    desc: "Le couscous royal cuit à la semoule fine"
  }
];

const heroContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const heroItemVariants = {
  hidden: { y: 15 },
  visible: {
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
  const [slideIndex, setSlideIndex] = useState(0);

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

  // Automatic slideshow rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="page-shell bg-background text-on-background">
      
      {/* Premium Hero Section */}
      <section className="relative w-full flex flex-col justify-center border-b border-outline/50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(180,83,9,0.06),transparent_55%)] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] [background-image:radial-gradient(rgba(133,24,24,0.15)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto w-full px-client-margin py-[--spacing-section-y-lg] grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-center relative z-10">
          <motion.div
             variants={heroContainerVariants}
             initial="hidden"
             animate="visible"
             className="lg:col-span-7 space-y-8 text-left"
          >
            <motion.h1 variants={heroItemVariants} className="text-display-lg font-bold tracking-wide leading-[1.05] text-on-background lowercase">
              {config?.nom ? config.nom : "Tastify"} <br/>
              <span className="text-primary font-heading italic block mt-1 font-normal">Cuisine marocaine.</span>
            </motion.h1>
 
            <motion.div variants={heroItemVariants} className="max-w-lg text-left">
                <p className="text-base md:text-lg text-on-surface-muted leading-relaxed">
                   Découvrez l'authenticité de nos recettes traditionnelles. Consultez notre carte d'exception, commandez vos mets favoris et réservez votre table en toute simplicité.
                </p>
            </motion.div>
 
            <motion.div variants={heroItemVariants} className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  to="/menu"
                  className="btn-primary w-full sm:w-auto min-h-[48px] gap-3 px-8 group shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 text-white"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Voir la carte</span>
                  <ArrowRight className="w-4 h-4 ml-auto sm:ml-0 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/reservations"
                  className="btn-secondary w-full sm:w-auto min-h-[48px] gap-3 px-8 group transition-all duration-300 hover:shadow-md"
                >
                  <CalendarDays className="w-4 h-4 text-accent" />
                  <span>Réserver une table</span>
                </Link>
            </motion.div>
          </motion.div>
 
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="lg:col-span-5 block"
          >
            <div className="relative group aspect-[4/5] max-h-[460px] lg:max-h-none rounded-2xl overflow-hidden border border-outline shadow-premium transition-all duration-500 hover:border-accent/30 bg-black select-none">
              <AnimatePresence mode="wait">
                <motion.img 
                    key={slideIndex}
                    src={HERO_IMAGES[slideIndex].src}
                    alt={HERO_IMAGES[slideIndex].desc}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 0.95, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.8 }}
                    fetchPriority="high"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/80 backdrop-blur-md border border-white/40 shadow-lg text-left z-10">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent mb-0.5">{HERO_IMAGES[slideIndex].label}</p>
                <p className="text-xs font-semibold text-on-background">{HERO_IMAGES[slideIndex].desc}</p>
              </div>

              {/* Minimal slide dots indicators */}
              <div className="absolute top-4 right-4 flex gap-1.5 z-10">
                {HERO_IMAGES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSlideIndex(idx)}
                    aria-label={`Aller à la diapositive ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      slideIndex === idx ? 'w-4 bg-accent' : 'w-1.5 bg-white/50 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
 
      {/* Featured / Top Dishes Section */}
      <section className="page-section mt-6 md:mt-10">
        <div className="max-w-[1200px] mx-auto px-client-margin">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 md:mb-16 gap-4">
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-bold text-accent tracking-[0.25em] uppercase block">Suggestions</span>
              <h3 className="text-3xl font-bold tracking-tight lowercase font-heading">Les plats appréciés.</h3>
            </div>
            <Link to="/menu" className="min-h-11 inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-on-background border-b border-outline hover:border-accent hover:text-accent transition-all duration-300">
                Découvrir toute la carte
            </Link>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {isLoading ? [1, 2].map(i => (
               <div key={i} className="aspect-video bg-surface-container-high animate-pulse rounded-2xl border border-outline" />
            )) : topDishes.length === 0 ? (
               <div className="col-span-full py-20 text-center rounded-2xl border border-dashed border-outline bg-surface-container/30">
                 <p className="text-xs font-bold uppercase tracking-widest text-on-surface-subtle">Sélection indisponible pour le moment</p>
               </div>
            ) : topDishes.map((dish) => (
              <motion.div 
                key={dish.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="menu-card p-6 flex flex-col h-full hover:border-[#D9A752]/40 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-high rounded-full border border-outline">
                        <TrendingUp className="w-3.5 h-3.5 text-success" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-success">Coup de cœur</span>
                    </div>
                </div>
 
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center flex-1 text-left">
                    <div className="lg:col-span-5">
                        <div className="aspect-square rounded-xl overflow-hidden border border-outline relative group bg-surface-container">
                            {dish.image ? (
                                <img src={dish.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={dish.nom} loading="lazy" decoding="async" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-surface-container-high text-on-surface-subtle font-bold text-4xl">{dish.nom.charAt(0)}</div>
                            )}
                        </div>
                    </div>
 
                    <div className="lg:col-span-7 space-y-4">
                        <div>
                            <h4 className="text-xl font-bold tracking-tight text-on-background font-heading uppercase">{dish.nom}</h4>
                            <p className="font-mono text-sm text-accent font-semibold mt-1">{parseFloat(dish.prix).toFixed(0)} {config?.devise || 'DH'}</p>
                        </div>
 
                        {dish.top_avis && dish.top_avis.length > 0 && (
                            <div className="pl-4 border-l border-accent/30 py-1 bg-surface-container/20 rounded-r-md">
                                <p className="text-xs italic text-on-surface-muted leading-relaxed line-clamp-2">
                                    "{dish.top_avis[0].commentaire}"
                                </p>
                            </div>
                        )}
 
                        <Link
                            to="/menu"
                            className="inline-flex min-h-11 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent hover:text-primary transition-colors border-b border-transparent hover:border-primary pb-0.5"
                        >
                            <span>Détails</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
 
      {/* Minimal Footer */}
      <footer className="page-section mt-12 px-client-margin border-t border-outline/50 bg-surface-container-high/50 md:mt-20">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 py-6 text-left">
          <div className="md:col-span-6 space-y-6">
                <Link to="/" className="inline-flex min-h-11 items-center">
                    <h2 className="text-2xl font-bold font-heading tracking-widest text-primary uppercase">
                        {config?.nom || "tastify."}
                    </h2>
                </Link>
                <p className="text-sm text-on-surface-muted leading-relaxed max-w-sm font-light">
                   Une expérience culinaire marocaine authentique et contemporaine. Réservations, commandes et fidélité en ligne.
                </p>
          </div>
 
          <div className="md:col-span-3 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent block">Navigation</span>
            <ul className="space-y-2">
              <li><Link to="/menu" className="inline-flex min-h-11 items-center text-xs text-on-surface-muted hover:text-primary transition-colors font-medium">La Carte</Link></li>
              <li><Link to="/reservations" className="inline-flex min-h-11 items-center text-xs text-on-surface-muted hover:text-primary transition-colors font-medium">Réservations</Link></li>
            </ul>
          </div>
 
          <div className="md:col-span-3 space-y-4 md:text-right">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent block">Contact</span>
            <div className="space-y-2 text-xs text-on-surface-muted font-medium">
                <p className="leading-relaxed">
                  {config?.adresse || "Casablanca"}
                </p>
                {config?.telephone && <p className="font-mono mt-1 text-sm font-semibold">{config.telephone}</p>}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
