import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  ArrowRight,
  ChevronRight,
  Phone
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
    <div className="h-full bg-background text-on-surface selection:bg-primary/20 overflow-y-auto custom-scrollbar font-body">
      
      {/* Editorial Hero */}
      <section className="relative min-h-[72vh] w-full flex flex-col justify-center overflow-hidden shrink-0 border-b border-outline-variant bg-surface-main">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=2000" 
            alt="Cinematic Dining" 
            className="w-full h-full object-cover opacity-30 grayscale-[0.5]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6 space-y-12">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <h1 className="text-display-lg-mobile md:text-display-lg text-primary mb-6 leading-[1.1] tracking-tighter">
              {config?.nom ? `${config.nom},` : "L’Art de la Table,"} <br className="hidden md:block"/> Réinventé
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto font-medium leading-relaxed">
              {config?.description || "Une table marocaine contemporaine, pensée pour celles et ceux qui veulent réserver vite, choisir juste et profiter d’un service soigné."}
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col sm:flex-row gap-6 justify-center pt-8"
          >
            <Link 
              to="/menu" 
              className="px-12 py-5 bg-primary text-on-primary rounded font-sans text-xs font-black uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/20 border border-primary"
            >
              Voir la carte
            </Link>
            <Link 
              to="/reservations" 
              className="px-12 py-5 border-2 border-primary text-primary rounded font-sans text-xs font-black uppercase tracking-[0.3em] transition-all hover:bg-primary/5 active:scale-95"
            >
              Réserver
            </Link>
          </motion.div>
        </div>
        
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-20 hidden md:block">
            <ChevronRight className="w-8 h-8 rotate-90 text-on-surface" />
        </div>
      </section>

      {/* Featured Creations */}
      <section className="py-24 bg-background border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-client-margin">
          <div className="flex justify-between items-end mb-16 border-b border-outline-variant pb-6">
            <div>
              <span className="editorial-kicker mb-2">SELECTION DU MOMENT</span>
              <h3 className="font-serif text-3xl md:text-4xl text-primary font-black uppercase tracking-tight">Créations Signature</h3>
            </div>
            <Link to="/menu" className="font-sans text-[11px] font-black text-primary hover:text-on-surface transition-colors uppercase tracking-[0.3em] inline-flex items-center gap-2">
              Voir la carte <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {isLoading ? [1, 2, 3].map(i => (
               <div key={i} className="aspect-[4/5] bg-surface-container animate-pulse rounded-2xl" />
            )) : hasRecommendationError ? (
              <div className="md:col-span-3 rounded-[2rem] border border-outline-variant bg-surface-container-lowest px-8 py-12 text-center">
                <p className="font-sans text-[10px] font-black uppercase tracking-[0.35em] text-primary">Sélection indisponible pour le moment</p>
                <p className="mx-auto mt-4 max-w-2xl text-body-base text-on-surface-variant leading-relaxed">
                  Notre sélection dynamique est momentanément hors ligne. La carte complète reste disponible et les réservations continuent normalement.
                </p>
                <Link
                  to="/menu"
                  className="mt-8 inline-flex items-center gap-3 rounded-full border border-primary px-8 py-4 font-sans text-[11px] font-black uppercase tracking-[0.3em] text-primary transition-colors hover:bg-primary/5"
                >
                  Voir toute la carte
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : topDishes.length === 0 ? (
              <div className="md:col-span-3 rounded-[2rem] border border-outline-variant bg-surface-container-lowest px-8 py-12 text-center">
                <p className="font-sans text-[10px] font-black uppercase tracking-[0.35em] text-primary">Nouvelles signatures en préparation</p>
                <p className="mx-auto mt-4 max-w-2xl text-body-base text-on-surface-variant leading-relaxed">
                  Nos recommandations sont en cours de mise à jour. Parcourez la carte complète pour découvrir tout le service.
                </p>
              </div>
            ) : topDishes.map((dish, idx) => (
              <motion.div 
                key={dish.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group flex flex-col gap-6"
              >
                <div className="aspect-[4/5] w-full relative overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-high transition-all duration-700 hover:border-primary/50">
                  {dish.image ? (
                    <img 
                      src={dish.image} 
                      className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" 
                      alt={dish.nom} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-serif italic text-6xl text-on-surface-variant/10">{dish.nom.charAt(0)}</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-6 right-6 font-sans text-2xl font-black text-primary tabular-nums tracking-tighter">
                    {parseFloat(dish.prix).toFixed(0)} {config?.devise || 'DH'}
                  </div>
                </div>
                <div className="space-y-2">
                   <h4 className="font-serif text-xl font-black text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors">{dish.nom}</h4>
                   <p className="font-body text-[15px] text-on-surface-variant leading-relaxed opacity-70 line-clamp-2 italic">{dish.description || 'Une composition de saison pensée pour un service précis et généreux.'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Reservation */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto bg-[#1a1614] rounded-[3rem] p-16 md:p-24 text-center relative overflow-hidden border border-outline-variant shadow-2xl">
          <div className="relative z-10 space-y-10">
            <h2 className="text-display-lg-mobile md:text-display-lg text-background italic leading-none">Réservez votre <br/> prochaine table.</h2>
            <p className="text-background/50 font-body text-lg max-w-xl mx-auto leading-relaxed">Choisissez votre créneau, découvrez la carte et laissez le service s’occuper du reste.</p>
            <div className="pt-6">
              <Link to="/reservations" className="inline-flex items-center gap-4 px-12 py-6 bg-primary text-on-primary rounded-full font-sans text-xs font-black uppercase tracking-[0.4em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/40">
                Réserver une table <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          {/* Subtle rim lighting overlay */}
          <div className="absolute inset-0 border border-white/5 rounded-[inherit] pointer-events-none" />
        </div>
      </section>

      {/* Editorial Footer */}
      <footer className="pt-24 pb-12 px-6 border-t border-outline-variant bg-surface-main">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="space-y-8">
            <h1 className="font-serif text-3xl font-black text-primary italic tracking-tighter leading-none m-0">{config?.nom || "Tastify."}</h1>
            <p className="text-sm font-body text-on-surface-variant leading-relaxed italic opacity-70">
              {config?.description || "Une hospitalité marocaine contemporaine, servie avec précision et simplicité."}
            </p>
          </div>

          <div className="space-y-6">
            <span className="editorial-kicker">PARCOURS</span>
            <ul className="space-y-3">
              <li><Link to="/menu" className="text-ui-label-bold text-[10px] text-on-surface-variant hover:text-primary transition-colors">Carte digitale</Link></li>
              <li><Link to="/reservations" className="text-ui-label-bold text-[10px] text-on-surface-variant hover:text-primary transition-colors">Réservations</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <span className="editorial-kicker">HORAIRES</span>
            <div className="space-y-3 font-sans text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant/60">
              {config?.horaires && Object.keys(config.horaires).length > 0 ? (
                Object.entries(config.horaires).map(([day, hours]) => (
                  <div key={day} className="flex justify-between border-b border-outline-variant/10 pb-2">
                    <span className="uppercase">{day}</span> 
                    <span className="text-on-surface">{hours}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between border-b border-outline-variant/10 pb-2"><span>MON-FRI</span> <span className="text-on-surface">12h — 23h</span></div>
                  <div className="flex justify-between border-b border-outline-variant/10 pb-2"><span>SAT-SUN</span> <span className="text-on-surface">11h — 00h</span></div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <span className="editorial-kicker">CONTACT & ADRESSE</span>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  {config?.adresse || "Boulevard d'Anfa, Quartier Racine, Casablanca 20250"}
                </p>
              </div>
              {config?.telephone && (
                <div className="flex items-center gap-4">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{config.telephone}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-12 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-sans text-[9px] font-black uppercase tracking-[0.5em] text-on-surface-variant/30">© 2026 {config?.nom?.toUpperCase() || "TASTIFY"} ECOSYSTEM</span>
          <div className="flex gap-8">
             <Link to="/login" className="font-sans text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 hover:text-primary transition-colors">Staff Terminal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
