import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Utensils, 
  MapPin,
  Phone,
  ArrowRight
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
    <div className="min-h-screen bg-background text-on-surface selection:bg-secondary-container selection:text-on-secondary-container overflow-x-hidden">
      
      {/* Full-bleed Hero Section */}
      <section className="relative h-[90vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=2000" 
            alt="Gourmet Dining Experience" 
            className="w-full h-full object-cover grayscale-[0.2]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#301400]/40 via-[#301400]/10 to-background"></div>
        </div>
        
        <div className="relative z-10 text-center px-8 max-w-5xl">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="text-display-lg text-primary mb-6"
          >
            The Art of <br className="hidden md:block"/> Conscious Gastronomy
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="text-body-lg text-on-surface max-w-2xl mx-auto mb-12 opacity-90"
          >
            Where Michelin-star precision meets the soulful warmth of organic heritage. A culinary journey designed for the discerning palate.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col md:flex-row gap-8 justify-center"
          >
            <Link 
              to="/menu" 
              className="px-12 py-5 bg-primary text-on-primary text-ui-button rounded-full border border-[#301400] transition-transform hover:scale-105 active:scale-95 cinematic-shadow"
            >
              View The Collection
            </Link>
            <Link 
              to="/reservations" 
              className="px-12 py-5 border-2 border-primary text-primary text-ui-button rounded-full hover:bg-primary/5 transition-all active:scale-95"
            >
              Discover Our Philosophy
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Editorial Section: The Story */}
      <section className="py-32 bg-background border-y border-on-surface/5">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="md:col-span-5 space-y-10"
            >
              <span className="editorial-kicker">OUR HERITAGE</span>
              <h2 className="text-headline-md text-on-background">A meticulous devotion to the earth’s finest offerings.</h2>
              <div className="space-y-6">
                <p className="text-body-lg text-on-surface-variant leading-relaxed">
                  We believe that true luxury lies in the purity of the ingredient. Every element on our menu is traced back to a specific patch of earth, a particular morning dew, and a farmer who knows the land by name.
                </p>
                <p className="text-body-lg text-on-surface-variant leading-relaxed">
                  Tastify was born from a desire to bridge the gap between tactical kitchen precision and the organic, unpredictable beauty of nature.
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="md:col-span-7 relative"
            >
              <div className="aspect-[4/5] w-full overflow-hidden border-2 border-[#301400] rounded-xl cinematic-shadow">
                <img 
                  src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1200" 
                  alt="Chef preparing organic ingredients" 
                  className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" 
                />
              </div>
              <div className="absolute -bottom-8 -left-8 hidden lg:block bg-surface-container-high p-8 border border-[#301400] w-72 rounded-lg">
                <p className="text-body-md italic text-primary">"The ingredients speak, we simply listen."</p>
                <p className="text-ui-data-dense mt-4">— Master Chef Julian Vance</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bento Grid: Featured Experiences */}
      <section className="py-32 bg-surface-container-low" id="menu">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-display-lg text-4xl md:text-5xl lg:text-6xl text-on-background">The Season’s Highlights</h2>
            <p className="text-body-lg text-on-surface-variant">Explore our curated selections for the current equinox.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-8 h-auto md:h-[800px]">
            {/* Large Feature - Top Dish 1 */}
            <div className="md:col-span-2 md:row-span-2 relative overflow-hidden group rounded-xl border border-[#301400] cinematic-shadow">
              {isLoading ? (
                <div className="w-full h-full bg-surface-container-high animate-pulse" />
              ) : topDishes[0] ? (
                <>
                  <img 
                    src={topDishes[0].image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1200"} 
                    alt={topDishes[0].nom} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[0.3] group-hover:grayscale-0" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#301400]/90 via-transparent to-transparent flex flex-col justify-end p-12 text-on-primary">
                    <span className="editorial-kicker text-secondary-container mb-2">SIGNATURE SELECTION</span>
                    <h3 className="text-display-lg text-4xl">{topDishes[0].nom}</h3>
                    <p className="text-body-md mt-4 opacity-80 max-w-sm">{topDishes[0].description}</p>
                    <Link to="/menu" className="mt-8 flex items-center gap-4 text-ui-button hover:text-secondary-container transition-colors group/btn">
                      Explore Catalog <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-2" />
                    </Link>
                  </div>
                </>
              ) : null}
            </div>

            {/* Vertical Card - Top Dish 2 */}
            <div className="md:col-span-1 md:row-span-2 relative overflow-hidden group rounded-xl border border-[#301400]">
              {isLoading ? (
                <div className="w-full h-full bg-surface-container-high animate-pulse" />
              ) : topDishes[1] ? (
                <>
                  <img 
                    src={topDishes[1].image || "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=1200"} 
                    alt={topDishes[1].nom} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#301400]/90 to-transparent flex flex-col justify-end p-8 text-on-primary">
                    <h3 className="text-headline-md">{topDishes[1].nom}</h3>
                    <Link to="/menu" className="mt-4 text-ui-button border border-white/30 px-6 py-2 rounded-lg hover:bg-white/10 transition-all text-center">
                      View Dish
                    </Link>
                  </div>
                </>
              ) : null}
            </div>

            {/* Small Square 1 - Editorial */}
            <div className="md:col-span-1 md:row-span-1 bg-background p-10 flex flex-col justify-center border border-[#301400] rounded-xl text-center hover:bg-surface-container-high transition-colors">
              <span className="text-primary text-4xl mb-6 flex justify-center"><Utensils className="w-10 h-10" /></span>
              <h4 className="text-headline-md text-on-background">Private Vault</h4>
              <p className="text-body-md text-on-surface-variant mt-4 opacity-80">Rare vintages from the world’s quietest valleys.</p>
            </div>

            {/* Small Square 2 - Action */}
            <div className="md:col-span-1 md:row-span-1 bg-primary p-10 flex flex-col justify-center rounded-xl text-center cinematic-shadow">
              <h4 className="text-headline-md text-on-primary">Table 01</h4>
              <p className="text-body-md text-on-primary/80 mt-4">Book the exclusive Chef's Table for an immersive evening.</p>
              <Link 
                to="/reservations" 
                className="mt-8 text-ui-button bg-on-primary text-primary px-6 py-3 rounded-lg transition-transform hover:scale-105 active:scale-95"
              >
                Request Access
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-48 bg-background flex items-center justify-center border-b border-on-surface/5">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="max-w-4xl mx-auto px-8 text-center space-y-12"
        >
          <span className="text-primary text-6xl opacity-20 font-serif">“</span>
          <blockquote className="text-display-lg text-3xl md:text-5xl lg:text-6xl text-on-background italic font-light leading-tight">
            Tastify isn’t just a dining portal; it’s an invitation to slow down and rediscover the inherent rhythm of the natural world through flavor.
          </blockquote>
          <div className="flex flex-col items-center gap-4">
            <span className="editorial-kicker">Architectural Digest</span>
            <div className="h-px w-12 bg-primary/20"></div>
          </div>
        </motion.div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 px-8 pb-48">
        <div className="max-w-[1400px] mx-auto bg-[#1d1b1a] rounded-[3rem] p-16 md:p-32 text-center relative overflow-hidden cinematic-shadow">
          <div className="relative z-10 space-y-12">
            <motion.h2 
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 30 }}
              className="text-display-lg text-4xl md:text-7xl lg:text-8xl text-background italic"
            >
              Reserve your <br /> Placement.
            </motion.h2>
            
            <p className="text-background/40 text-xl font-body max-w-xl mx-auto">
              Select your temporal window, explore the catalog, and enjoy a seamless experience from the moment of intent.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-10 pt-10">
              <Link 
                to="/reservations" 
                className="w-full sm:w-auto px-16 py-6 bg-primary text-on-primary text-ui-button hover:scale-105 transition-all cinematic-shadow"
              >
                Initialize Booking
              </Link>
              <Link 
                to="/menu" 
                className="w-full sm:w-auto text-ui-button text-background/60 hover:text-background transition-all border-b border-background/10 pb-2"
              >
                View Catalog
              </Link>
            </div>
          </div>
          
          {/* Geometric accents */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -rotate-12 translate-x-1/4" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 border border-background/5 rounded-full" />
        </div>
      </section>

      {/* Editorial Footer */}
      <footer className="pt-24 pb-12 px-8 border-t border-on-surface/5 bg-surface-container-low">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-20 mb-24">
          <div className="md:col-span-5 space-y-10">
            <span className="text-2xl font-serif italic font-bold tracking-tight text-primary">Tastify.</span>
            <p className="text-base font-body text-on-surface-variant leading-relaxed max-w-sm italic opacity-80">
              Exceptional Moroccan hospitality orchestrated through discrete digital intelligence.
            </p>
          </div>

          <div className="md:col-span-2 space-y-6">
            <span className="editorial-kicker">Navigation</span>
            <ul className="space-y-4">
              <li><Link to="/menu" className="text-ui-label-bold text-[10px] text-on-surface-variant hover:text-primary transition-colors">Catalog</Link></li>
              <li><Link to="/reservations" className="text-ui-label-bold text-[10px] text-on-surface-variant hover:text-primary transition-colors">Bookings</Link></li>
              <li><Link to="/account" className="text-ui-label-bold text-[10px] text-on-surface-variant hover:text-primary transition-colors">Identity</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-6">
            <span className="editorial-kicker">Temporal</span>
            <ul className="space-y-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">
              <li className="flex justify-between"><span>Mon - Fri</span> <span className="text-on-surface">12:00 — 23:00</span></li>
              <li className="flex justify-between"><span>Sat - Sun</span> <span className="text-on-surface">11:30 — 00:00</span></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-6">
            <span className="editorial-kicker">Coordinate</span>
            <ul className="space-y-4">
              <li className="flex items-start gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
                <MapPin className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} /> 
                <span>123 Avenue Hassan II <br /> Casablanca, Morocco</span>
              </li>
              <li className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
                <Phone className="w-4 h-4 text-primary" strokeWidth={1.5} /> 
                <span>+212 5 22 00 00 00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto pt-12 border-t border-on-surface/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-on-surface-variant/40">© 2026 TASTIFY — CULINARY ARCHITECTURE.</p>
          <div className="flex gap-10 text-[9px] font-black uppercase tracking-[0.4em] text-on-surface-variant/40">
            <Link to="/legal" className="hover:text-primary transition-colors">Legal Manifest</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Protocol</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};


