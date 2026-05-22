import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin,
  ArrowRight,
  ChevronRight,
  Quote
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { menuApi } from '../../api/menu';
import type { Plat } from '../../api/menu';

export const PortalHomePage = () => {
  const [topDishes, setTopDishes] = useState<Plat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopDishes = async () => {
      try {
        const res = await menuApi.getTopRecommendations();
        setTopDishes(res.data.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch top dishes', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopDishes();
  }, []);

  return (
    <div className="h-full bg-background text-on-surface selection:bg-primary/20 overflow-y-auto custom-scrollbar font-body">
      
      {/* Editorial Hero */}
      <section className="relative min-h-[85vh] w-full flex flex-col justify-center overflow-hidden shrink-0 border-b border-outline-variant bg-surface-main">
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
              L’Art de la Table, <br className="hidden md:block"/> Réinventé
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto uppercase tracking-[0.1em] font-medium leading-relaxed">
              Une expérience gastronomique où la précision chirurgicale rencontre la sophistication organique.
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
              The Catalog
            </Link>
            <Link 
              to="/reservations" 
              className="px-12 py-5 border-2 border-primary text-primary rounded font-sans text-xs font-black uppercase tracking-[0.3em] transition-all hover:bg-primary/5 active:scale-95"
            >
              Bookings
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
              <span className="editorial-kicker mb-2">CURATED SELECTIONS</span>
              <h3 className="font-serif text-3xl md:text-4xl text-primary font-black uppercase tracking-tight">Créations Signature</h3>
            </div>
            <Link to="/menu" className="font-sans text-[11px] font-black text-primary hover:text-on-surface transition-colors uppercase tracking-[0.3em] hidden sm:flex items-center gap-2">
              View Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {isLoading ? [1, 2, 3].map(i => (
               <div key={i} className="aspect-[4/5] bg-surface-container animate-pulse rounded-2xl" />
            )) : topDishes.map((dish, idx) => (
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
                    {parseFloat(dish.prix).toFixed(0)} DH
                  </div>
                </div>
                <div className="space-y-2">
                   <h4 className="font-serif text-xl font-black text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors">{dish.nom}</h4>
                   <p className="font-body text-[15px] text-on-surface-variant leading-relaxed opacity-60 line-clamp-2 italic">{dish.description || 'A masterpiece of seasonal ingredients and culinary precision.'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 bg-surface-container-lowest relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
          <Quote className="w-12 h-12 text-primary mx-auto opacity-20" />
          <motion.blockquote 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="font-serif text-2xl md:text-4xl text-on-surface italic leading-tight font-light"
          >
            "Tastify n’est pas seulement un portail de restauration ; c’est une invitation à ralentir et à redécouvrir le rythme inhérent du monde naturel."
          </motion.blockquote>
          <div className="flex flex-col items-center gap-4">
             <div className="w-12 h-px bg-primary/40" />
             <span className="font-sans text-[10px] font-black uppercase tracking-[0.4em] text-primary">Architectural Digest</span>
          </div>
        </div>
        
        {/* Abstract background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      </section>

      {/* CTA Reservation */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto bg-[#1a1614] rounded-[3rem] p-16 md:p-24 text-center relative overflow-hidden border border-outline-variant shadow-2xl">
          <div className="relative z-10 space-y-10">
            <h2 className="text-display-lg-mobile md:text-display-lg text-background italic leading-none">Initialize your <br/> placement.</h2>
            <p className="text-background/40 font-body text-lg max-w-xl mx-auto uppercase tracking-widest leading-relaxed">Select your temporal window and explore the catalog.</p>
            <div className="pt-6">
              <Link to="/reservations" className="inline-flex items-center gap-4 px-12 py-6 bg-primary text-on-primary rounded-full font-sans text-xs font-black uppercase tracking-[0.4em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/40">
                Book a Table <ArrowRight className="w-4 h-4" />
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
            <h1 className="font-serif text-3xl font-black text-primary italic tracking-tighter leading-none m-0">Tastify.</h1>
            <p className="text-sm font-body text-on-surface-variant leading-relaxed italic opacity-60 uppercase tracking-tight">Exceptional Moroccan hospitality orchestrated through digital intelligence.</p>
          </div>

          <div className="space-y-6">
            <span className="editorial-kicker">COLLECTIONS</span>
            <ul className="space-y-3">
              <li><Link to="/menu" className="text-ui-label-bold text-[10px] text-on-surface-variant hover:text-primary transition-colors">Digital Menu</Link></li>
              <li><Link to="/reservations" className="text-ui-label-bold text-[10px] text-on-surface-variant hover:text-primary transition-colors">Booking Portal</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <span className="editorial-kicker">TEMPORAL</span>
            <div className="space-y-3 font-sans text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant/60">
              <div className="flex justify-between border-b border-outline-variant/10 pb-2"><span>MON-FRI</span> <span className="text-on-surface">12h — 23h</span></div>
              <div className="flex justify-between border-b border-outline-variant/10 pb-2"><span>SAT-SUN</span> <span className="text-on-surface">11h — 00h</span></div>
            </div>
          </div>

          <div className="space-y-6">
            <span className="editorial-kicker">COORDINATE</span>
            <div className="flex items-start gap-4">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">1200 Commerce St, Suite 400<br/>Metropolis, NY 10001</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-12 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-sans text-[9px] font-black uppercase tracking-[0.5em] text-on-surface-variant/30">© 2026 TASTIFY ECOSYSTEM</span>
          <div className="flex gap-8">
             <Link to="/login" className="font-sans text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 hover:text-primary transition-colors">Staff Terminal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};



