import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  ArrowRight,
  ChevronRight,
  Phone,
  Mail,
  Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { menuApi } from '../../api/menu';
import { useConfigStore } from '../../store/configStore';
import type { Plat } from '../../api/menu';

export const PortalHomePage = () => {
  const [topDishes, setTopDishes] = useState<Plat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRecommendationError, setHasRecommendationError] = useState(false);
  const { config } = useConfigStore();

  useEffect(() => {
    const fetchTopDishes = async () => {
      try {
        const res = await menuApi.getTopRecommendations();
        setTopDishes(res.data.slice(0, 3));
        setHasRecommendationError(false);
      } catch (err) {
        console.error('Failed to fetch top dishes', err);
        setTopDishes([]);
        setHasRecommendationError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopDishes();
  }, []);

  return (
    <div className="h-full bg-background text-on-surface selection:bg-primary/20 overflow-y-auto custom-scrollbar font-body scroll-smooth">
      
      {/* Editorial Hero */}
      <section className="relative min-h-[85vh] w-full flex flex-col justify-center overflow-hidden shrink-0 border-b border-outline-variant bg-surface-main">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=2000" 
            alt="Cinematic Dining" 
            className="w-full h-full object-cover opacity-20 grayscale-[0.2]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto text-center px-6 space-y-16">
          <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1.4, ease: [0.23, 1, 0.32, 1] }}
             className="space-y-8"
          >
            <span className="editorial-kicker text-primary/80 block">EXPÉRIENCE GASTRONOMIQUE</span>
            <h1 className="text-display-lg-mobile md:text-display-lg text-primary mb-6 leading-[1.05] tracking-tight font-serif italic">
              {config?.nom ? `${config.nom}` : "Tastify"} <br className="hidden md:block"/> 
              <span className="text-on-surface not-italic">L'Émotion Culinaire.</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto font-medium leading-relaxed opacity-90">
              {config?.description || "Une table marocaine contemporaine, pensée pour celles et ceux qui veulent réserver vite, choisir juste et profiter d’un service soigné."}
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col sm:flex-row gap-8 justify-center pt-10"
          >
            <Link 
              to="/menu" 
              className="px-14 py-6 bg-primary text-on-primary rounded-full font-sans text-[11px] font-black uppercase tracking-[0.35em] transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/30 border border-primary group"
            >
              Découvrir la carte
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="inline-block ml-3">
                <ArrowRight className="w-4 h-4 inline" />
              </motion.span>
            </Link>
            <Link 
              to="/reservations" 
              className="px-14 py-6 border-2 border-primary/40 text-primary rounded-full font-sans text-[11px] font-black uppercase tracking-[0.35em] transition-all hover:bg-primary/5 hover:border-primary active:scale-95"
            >
              Réserver une table
            </Link>
          </motion.div>
        </div>
        
        <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 opacity-30 hidden md:block"
        >
            <ChevronRight className="w-10 h-10 rotate-90 text-on-surface" strokeWidth={1} />
        </motion.div>
      </section>

      {/* Featured Creations */}
      <section className="py-32 bg-background border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-client-margin">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 border-b border-outline-variant/30 pb-10 gap-8">
            <div className="space-y-4">
              <span className="editorial-kicker text-primary/60">SÉLECTION SIGNATURE</span>
              <h3 className="font-serif text-4xl md:text-5xl text-on-surface font-black uppercase tracking-tight">Le Chef vous propose</h3>
            </div>
            <Link to="/menu" className="font-sans text-[11px] font-black text-primary hover:text-on-surface transition-all uppercase tracking-[0.4em] inline-flex items-center gap-3 border-b-2 border-primary/20 pb-1 hover:border-primary">
              Parcourir la carte complète <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {isLoading ? [1, 2, 3].map(i => (
               <div key={i} className="aspect-[3/4] bg-surface-container animate-pulse rounded-3xl" />
            )) : hasRecommendationError ? (
              <div className="md:col-span-3 rounded-[3rem] border border-outline-variant bg-surface-container-lowest px-10 py-20 text-center space-y-8">
                <p className="font-sans text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Service Momentanément Indisponible</p>
                <h4 className="font-serif text-3xl text-on-surface italic">Notre sélection se renouvelle...</h4>
                <p className="mx-auto max-w-2xl text-body-base text-on-surface-variant/80 leading-relaxed font-medium">
                  Le système de recommandation intelligent est en cours de recalibrage pour vous offrir le meilleur de notre terroir.
                </p>
                <Link
                  to="/menu"
                  className="inline-flex items-center gap-4 rounded-full bg-primary/10 border border-primary/20 px-10 py-5 font-sans text-[11px] font-black uppercase tracking-[0.35em] text-primary transition-all hover:bg-primary hover:text-on-primary"
                >
                  Voir toute la carte
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : topDishes.length === 0 ? (
              <div className="md:col-span-3 rounded-[3rem] border border-outline-variant bg-surface-container-lowest px-10 py-20 text-center">
                <p className="font-sans text-[11px] font-black uppercase tracking-[0.4em] text-primary/40">Inspiration en cours</p>
                <p className="mx-auto mt-6 max-w-2xl text-body-lg text-on-surface-variant font-serif italic">
                  Nous peaufinons notre sélection pour vous surprendre.
                </p>
              </div>
            ) : topDishes.map((dish, idx) => (
              <motion.div 
                key={dish.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: idx * 0.15, duration: 0.8 }}
                className="group flex flex-col gap-8"
              >
                <div className="aspect-[3/4] w-full relative overflow-hidden rounded-[2rem] border border-outline-variant/50 bg-surface-container-high transition-all duration-1000 hover:border-primary shadow-lg">
                  {dish.image ? (
                    <img 
                      src={dish.image} 
                      className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" 
                      alt={dish.nom} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-serif italic text-7xl text-on-surface-variant/5">{dish.nom.charAt(0)}</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                    <div className="bg-primary/95 text-on-primary px-5 py-2 rounded-full font-sans text-xl font-black tabular-nums shadow-2xl">
                      {parseFloat(dish.prix).toFixed(0)} <span className="text-xs uppercase ml-1 opacity-80">{config?.devise || 'DH'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 px-2">
                   <div className="flex justify-between items-center">
                      <h4 className="font-serif text-2xl font-black text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors">{dish.nom}</h4>
                      <div className="w-10 h-[1px] bg-outline-variant group-hover:w-16 group-hover:bg-primary transition-all duration-500" />
                   </div>
                   <p className="font-body text-base text-on-surface-variant leading-relaxed opacity-80 line-clamp-2 italic font-medium">
                    {dish.description || 'Une composition de saison pensée pour un service précis et généreux.'}
                   </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Reservation - Premium Stylized */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto bg-surface-container-highest rounded-[4rem] p-16 md:p-32 text-center relative overflow-hidden border border-outline-variant shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 z-0">
             <img 
               src="https://images.unsplash.com/photo-1550966841-3ee5ad6ce101?auto=format&fit=crop&q=80&w=2000" 
               className="w-full h-full object-cover opacity-10 scale-110 blur-sm" 
               alt=""
             />
             <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-background/40" />
          </div>

          <div className="relative z-10 space-y-12">
            <span className="editorial-kicker text-primary animate-pulse">RESERVATIONS OUVERTES</span>
            <h2 className="text-display-lg-mobile md:text-display-lg text-on-surface font-serif italic leading-[0.95] tracking-tighter">
              Prenez place à <br/> <span className="text-primary not-italic font-black uppercase">notre table.</span>
            </h2>
            <p className="text-on-surface-variant font-body text-xl max-w-2xl mx-auto leading-relaxed font-medium">
              Laissez-vous porter par un service d'exception où chaque detail est une intention.
            </p>
            <div className="pt-8">
              <Link to="/reservations" className="inline-flex items-center gap-6 px-16 py-7 bg-primary text-on-primary rounded-full font-sans text-xs font-black uppercase tracking-[0.5em] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(220,38,38,0.3)] group">
                Réserver mon expérience
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
          
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mb-32 blur-3xl" />
        </div>
      </section>

      {/* Editorial Footer - High Premium */}
      <footer className="pt-32 pb-16 px-6 md:px-12 border-t border-outline-variant bg-surface-main relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 mb-28">
          <div className="md:col-span-5 space-y-12">
            <div className="space-y-6">
                <Link to="/" className="inline-block">
                    <h1 className="font-serif text-5xl font-black text-primary italic tracking-tighter leading-none m-0">
                        {config?.nom || "Tastify."}
                    </h1>
                </Link>
                <p className="text-lg font-body text-on-surface-variant leading-relaxed italic opacity-80 max-w-md">
                   {config?.description || "Une hospitalité marocaine contemporaine, servie avec précision et simplicité."}
                </p>
            </div>
            
            <div className="flex gap-6">
                {[1, 2, 3].map((_, i) => (
                    <a key={i} href="#" className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all duration-300 active:scale-90">
                        <Share2 className="w-5 h-5" strokeWidth={1.5} />
                    </a>
                ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-10">
            <span className="editorial-kicker text-primary/40">NAVIGATION</span>
            <ul className="space-y-5">
              <li><Link to="/menu" className="text-ui-label-bold text-xs text-on-surface hover:text-primary transition-colors block">Carte Digitale</Link></li>
              <li><Link to="/reservations" className="text-ui-label-bold text-xs text-on-surface hover:text-primary transition-colors block">Réservations</Link></li>
              <li><Link to="/loyalty" className="text-ui-label-bold text-xs text-on-surface hover:text-primary transition-colors block">L'Échelon</Link></li>
              <li><Link to="/contact" className="text-ui-label-bold text-xs text-on-surface hover:text-primary transition-colors block">Concierge</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-10">
            <span className="editorial-kicker text-primary/40">HORAIRES</span>
            <div className="space-y-4 font-sans text-[11px] font-black uppercase tracking-[0.15em] text-on-surface">
              {config?.horaires && Object.keys(config.horaires).length > 0 ? (
                Object.entries(config.horaires).map(([day, hours]) => (
                  <div key={day} className="flex justify-between border-b border-outline-variant/10 pb-2 group">
                    <span className="text-on-surface-variant group-hover:text-primary transition-colors">{day}</span> 
                    <span className="font-mono">{hours}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                    <span className="text-on-surface-variant">LUN — VEN</span> 
                    <span className="font-mono">12:00 — 23:00</span>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                    <span className="text-on-surface-variant">SAM — DIM</span> 
                    <span className="font-mono">11:00 — 00:00</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="md:col-span-3 space-y-10">
            <span className="editorial-kicker text-primary/40">COORDONNÉES</span>
            <div className="space-y-8">
              <div className="flex items-start gap-5 group cursor-default">
                <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                    <MapPin className="w-4 h-4" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-on-surface leading-loose">
                  {config?.adresse || "Boulevard d'Anfa, Quartier Racine, Casablanca 20250"}
                </p>
              </div>
              
              {config?.telephone && (
                <div className="flex items-center gap-5 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <p className="text-[12px] font-mono font-black text-on-surface tracking-tighter">{config.telephone}</p>
                </div>
              )}

              {config?.email && (
                <div className="flex items-center gap-5 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] font-black text-on-surface uppercase tracking-widest truncate">{config.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-16 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <span className="font-sans text-[10px] font-black uppercase tracking-[0.5em] text-on-surface-variant/30">
                © {new Date().getFullYear()} {config?.nom?.toUpperCase() || "TASTIFY"} SYSTEM
            </span>
            <div className="h-4 w-[1px] bg-outline-variant/30 hidden md:block" />
            <div className="flex gap-6">
                <Link to="/legal" className="text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 hover:text-primary transition-colors">Mentions Légales</Link>
                <Link to="/privacy" className="text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 hover:text-primary transition-colors">Confidentialité</Link>
            </div>
          </div>
          <div className="flex items-center gap-10">
             <Link to="/login" className="px-6 py-2 rounded border border-outline-variant/50 font-sans text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant/50 hover:text-primary hover:border-primary transition-all active:scale-95">
                Staff Terminal
             </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
