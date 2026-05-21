import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin,
  ArrowRight,
  ChevronRight
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
    <div className="h-full bg-background text-on-surface selection:bg-secondary-container selection:text-on-secondary-container overflow-y-auto custom-scrollbar">
      
      {/* Full-bleed Hero Section */}
      <section className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden shrink-0">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=2000" 
            alt="Gourmet Dining Experience" 
            className="w-full h-full object-cover grayscale-[0.2]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#301400]/40 via-[#301400]/10 to-background"></div>
        </div>
        
        <div className="relative z-10 text-center px-8 max-w-4xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="text-display-lg text-4xl md:text-5xl lg:text-6xl text-primary mb-4"
          >
            The Art of <br className="hidden md:block"/> Conscious Gastronomy
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="text-body-lg text-on-surface-variant max-w-xl mx-auto mb-10 opacity-90 italic"
          >
            Michelin-star precision meets the soulful warmth of organic heritage.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col md:flex-row gap-6 justify-center"
          >
            <Link 
              to="/menu" 
              className="px-10 py-4 bg-primary text-on-primary text-ui-button rounded-full border border-[#301400] transition-transform hover:scale-105 active:scale-95 cinematic-shadow"
            >
              The Collection
            </Link>
            <Link 
              to="/reservations" 
              className="px-10 py-4 border-2 border-primary text-primary text-ui-button rounded-full hover:bg-primary/5 transition-all active:scale-95"
            >
              Our Philosophy
            </Link>
          </motion.div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-20">
            <ChevronRight className="w-6 h-6 rotate-90" />
        </div>
      </section>

      {/* Editorial Section: The Story */}
      <section className="py-20 bg-background border-y border-on-surface/5">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="md:col-span-5 space-y-8"
            >
              <span className="editorial-kicker">OUR HERITAGE</span>
              <h2 className="text-headline-md text-3xl text-on-background">Devotion to the earth’s finest offerings.</h2>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                Luxury lies in purity. Every element on our menu is traced back to a specific patch of earth and a farmer who knows its name.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="md:col-span-7 relative"
            >
              <div className="aspect-video w-full overflow-hidden border border-on-surface/5 rounded-2xl cinematic-shadow">
                <img 
                  src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1200" 
                  alt="Chef preparing organic ingredients" 
                  className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" 
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bento Grid: Featured Experiences */}
      <section className="py-20 bg-surface-container-low" id="menu">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-display-lg text-4xl text-on-background italic">The Season’s Highlights</h2>
            <p className="text-body-md text-on-surface-variant opacity-60">Curated selections for the current equinox.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-1 gap-6">
            {/* Large Feature - Top Dish 1 */}
            <div className="md:col-span-2 relative overflow-hidden group rounded-2xl border border-on-surface/5 cinematic-shadow aspect-[16/10]">
              {isLoading ? (
                <div className="w-full h-full bg-surface-container-high animate-pulse" />
              ) : topDishes[0] ? (
                <>
                  <img 
                    src={topDishes[0].image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1200"} 
                    alt={topDishes[0].nom} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[0.3] group-hover:grayscale-0" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#301400]/80 via-transparent to-transparent flex flex-col justify-end p-8 text-on-primary">
                    <span className="editorial-kicker text-[8px] text-secondary-container mb-1 uppercase">Featured</span>
                    <h3 className="text-display-lg text-2xl">{topDishes[0].nom}</h3>
                    <Link to="/menu" className="mt-4 flex items-center gap-2 text-ui-label-bold text-[10px] uppercase tracking-widest hover:text-secondary-container transition-colors">
                      Explore <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </>
              ) : null}
            </div>

            {/* Vertical Card - Top Dish 2 */}
            <div className="md:col-span-1 relative overflow-hidden group rounded-2xl border border-on-surface/5 aspect-[10/16] md:aspect-auto">
              {isLoading ? (
                <div className="w-full h-full bg-surface-container-high animate-pulse" />
              ) : topDishes[1] ? (
                <>
                  <img 
                    src={topDishes[1].image || "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=1200"} 
                    alt={topDishes[1].nom} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#301400]/80 to-transparent flex flex-col justify-end p-6 text-on-primary text-center">
                    <h3 className="text-headline-md text-xl italic">{topDishes[1].nom}</h3>
                  </div>
                </>
              ) : null}
            </div>

            {/* Small Action */}
            <div className="md:col-span-1 bg-primary p-8 flex flex-col justify-center rounded-2xl text-center cinematic-shadow gap-4">
              <h4 className="text-headline-md text-xl text-on-primary italic leading-tight">Private <br/>Placement</h4>
              <p className="text-[11px] font-body text-on-primary/60 uppercase tracking-widest leading-relaxed">Book the exclusive Chef's Table.</p>
              <Link 
                to="/reservations" 
                className="mt-2 text-ui-label-bold text-[10px] uppercase tracking-[0.2em] bg-on-primary text-primary py-3 rounded-lg transition-transform hover:scale-105 active:scale-95"
              >
                Initialize
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 bg-background flex items-center justify-center border-b border-on-surface/5">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="max-w-4xl mx-auto px-8 text-center space-y-8"
        >
          <span className="text-primary text-4xl opacity-20 font-serif">“</span>
          <blockquote className="text-display-lg text-2xl md:text-4xl text-on-background italic font-light leading-tight">
            Tastify isn’t just a dining portal; it’s an invitation to slow down and rediscover the inherent rhythm of the natural world.
          </blockquote>
          <div className="flex flex-col items-center gap-2">
            <span className="editorial-kicker text-[8px]">Architectural Digest</span>
          </div>
        </motion.div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 px-8">
        <div className="max-w-[1200px] mx-auto bg-[#1d1b1a] rounded-[2rem] p-16 text-center relative overflow-hidden cinematic-shadow">
          <div className="relative z-10 space-y-8">
            <motion.h2 
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              className="text-display-lg text-3xl md:text-5xl text-background italic"
            >
              Reserve your <br /> Placement.
            </motion.h2>
            
            <p className="text-background/40 text-base font-body max-w-md mx-auto">
              Select your temporal window and explore the catalog.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <Link 
                to="/reservations" 
                className="w-full sm:w-auto px-10 py-4 bg-primary text-on-primary text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all cinematic-shadow rounded-full"
              >
                Initialize Booking
              </Link>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -rotate-12 translate-x-1/4" />
        </div>
      </section>

      {/* Editorial Footer */}
      <footer className="pt-16 pb-8 px-8 border-t border-on-surface/5 bg-surface-container-low">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-5 space-y-6">
            <span className="text-xl font-serif italic font-bold tracking-tight text-primary">Tastify.</span>
            <p className="text-sm font-body text-on-surface-variant leading-relaxed max-w-xs italic opacity-60">
              Exceptional Moroccan hospitality orchestrated through digital intelligence.
            </p>
          </div>

          <div className="md:col-span-2 space-y-4">
            <span className="editorial-kicker">Navigation</span>
            <ul className="space-y-2">
              <li><Link to="/menu" className="text-ui-label-bold text-[9px] text-on-surface-variant hover:text-primary transition-colors">Catalog</Link></li>
              <li><Link to="/reservations" className="text-ui-label-bold text-[9px] text-on-surface-variant hover:text-primary transition-colors">Bookings</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-4">
            <span className="editorial-kicker">Temporal</span>
            <ul className="space-y-2 text-[9px] font-black uppercase tracking-[0.1em] text-on-surface-variant/60">
              <li className="flex justify-between"><span>Mon-Fri</span> <span className="text-on-surface">12-23h</span></li>
              <li className="flex justify-between"><span>Sat-Sun</span> <span className="text-on-surface">11-00h</span></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-4">
            <span className="editorial-kicker">Coordinate</span>
            <ul className="space-y-2">
              <li className="flex items-start gap-3 text-[9px] font-black uppercase tracking-[0.1em] text-on-surface-variant">
                <MapPin className="w-3 h-3 text-primary shrink-0" strokeWidth={1.5} /> 
                <span>Casablanca, Morocco</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto pt-8 border-t border-on-surface/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-on-surface-variant/30">© 2026 TASTIFY.</p>
        </div>
      </footer>
    </div>
  );
};


