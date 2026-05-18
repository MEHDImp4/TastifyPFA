import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
  ArrowRight, 
  Clock, 
  ChefHat, 
  Sparkles, 
  Calendar,
  ChevronDown,
  Wind,
  Layers,
  Zap
} from 'lucide-react';
import { menuApi } from '../../api/menu';
import type { Plat } from '../../api/menu';
import { useConfigStore } from '../../store/configStore';
import { getBrandName } from '../../components/branding/BrandWordmark';

// Animation primitives
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 1, ease: [0.23, 1, 0.32, 1] as const }
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
  viewport: { once: true, margin: "-100px" }
};

const staggerItem = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] as const }
};

export const PortalHomePage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Plat[]>([]);
  const config = useConfigStore(state => state.config);
  const brandName = getBrandName(config?.nom);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    menuApi.getTopRecommendations()
      .then(res => setRecommendations(res.data))
      .catch(err => console.error(err));
  }, []);

  // Parallax transforms
  const heroY = useTransform(smoothProgress, [0, 0.2], [0, -100]);

  return (
    <div ref={containerRef} className="w-full bg-background selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Premium Editorial Hero - Asymmetrical Split */}
      <section className="relative min-h-[100dvh] flex items-center pt-24 lg:pt-0 overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center">
          
          {/* Left: Cinematic Typography */}
          <div className="lg:col-span-7 relative z-20 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-10 md:space-y-16"
            >
              <motion.div 
                className="inline-flex items-center gap-3 px-0 text-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="w-12 h-[1px] bg-primary/40" />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em]">Est. 2024 — {brandName} Estate</span>
              </motion.div>

              <h1 className="text-7xl sm:text-8xl md:text-[9rem] lg:text-[11rem] font-serif leading-[0.8] tracking-[-0.04em] text-[#301400]">
                A Taste of <br />
                <span className="italic font-light text-primary/80 block mt-4">Infinity.</span>
              </h1>

              <div className="max-w-xl space-y-8">
                <p className="text-xl md:text-2xl font-sans text-[#301400]/80 leading-relaxed text-balance">
                  Where Moroccan heritage meets architectural precision. <br className="hidden md:block" />
                  An orchestrated experience for the most discerning tables.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 pt-4">
                  <Link 
                    to="/reservations"
                    className="group relative flex items-center gap-4 pl-10 pr-4 py-4 bg-[#301400] text-white rounded-full font-black uppercase text-[10px] tracking-[0.25em] transition-all hover:scale-105 active:scale-95"
                  >
                    <span>Secure a Table</span>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-transform group-hover:rotate-45">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                  <Link 
                    to="/menu"
                    className="group flex items-center gap-3 text-[#301400] font-black uppercase text-[10px] tracking-[0.25em] hover:text-primary transition-colors"
                  >
                    <span>Explore Menu</span>
                    <div className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Architectural Visual */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
              className="relative aspect-[4/5] lg:aspect-[3/4] w-full"
            >
              {/* Double-Bezel Architecture */}
              <div className="absolute inset-0 p-3 bg-white/5 border border-[#301400]/5 rounded-[3rem] shadow-2xl overflow-hidden">
                <div className="relative w-full h-full rounded-[calc(3rem-0.75rem)] overflow-hidden">
                  <motion.div 
                    style={{ y: heroY }}
                    className="absolute inset-0"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2000" 
                      alt="Luxury Dining"
                      className="w-full h-full object-cover scale-110"
                    />
                    <div className="absolute inset-0 bg-[#301400]/10 mix-blend-multiply" />
                  </motion.div>
                </div>
              </div>

              {/* Decorative Accent */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-secondary/5 blur-3xl rounded-full animate-pulse" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Vision - Full Bleed Editorial */}
      <section className="py-32 md:py-60 bg-surface relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
          <motion.div 
            className="lg:col-span-6 space-y-12"
            {...fadeInUp}
          >
            <div className="space-y-6">
              <span className="editorial-kicker">Our Philosophy</span>
              <h2 className="text-5xl md:text-7xl font-display-accent text-on-surface leading-[0.9] tracking-tight">
                Crafting <br />
                <span className="italic">Emotional</span> <br />
                Architecture.
              </h2>
            </div>
            
            <div className="space-y-8 text-on-surface-variant font-body-text text-xl leading-relaxed opacity-80">
              <p>
                We believe a restaurant is more than a space; it's a living organism. At {brandName}, technology serves as the invisible pulse, ensuring every moment is timed to perfection, while our culinary soul remains rooted in the sun-baked earth of the Maghreb.
              </p>
              <p className="italic text-primary font-serif">
                "We don't just serve food; we design the memory of a meal."
              </p>
            </div>

            <div className="flex items-center gap-8 pt-8">
              <div className="text-center">
                <p className="text-4xl font-display-accent text-on-surface">12</p>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mt-2">Master Chefs</p>
              </div>
              <div className="w-px h-12 bg-outline-variant/30" />
              <div className="text-center">
                <p className="text-4xl font-display-accent text-on-surface">402</p>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mt-2">Neural Pairings</p>
              </div>
              <div className="w-px h-12 bg-outline-variant/30" />
              <div className="text-center">
                <p className="text-4xl font-display-accent text-on-surface">100%</p>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mt-2">Verified Traceability</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="lg:col-span-6 relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
            viewport={{ once: true }}
          >
            {/* Double-Bezel Architecture */}
            <div className="relative aspect-[4/5] p-3 bg-white/5 border border-[#301400]/5 rounded-[3rem] shadow-2xl overflow-hidden group">
              <div className="relative w-full h-full rounded-[calc(3rem-0.75rem)] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=1000" 
                  alt="Chef at work"
                  className="w-full h-full object-cover transition-transform duration-2000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 to-transparent" />
                <div className="absolute bottom-10 left-10 text-white">
                  <p className="font-display-accent italic text-3xl">Precision in every cut.</p>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-8 h-px bg-primary" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-60">Verified Origin</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Glass Element */}
            <motion.div 
              className="absolute -top-10 -left-10 md:-left-20 glass p-8 rounded-[2.5rem] shadow-2xl z-20 max-w-[280px]"
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Wind className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">Freshness Index</span>
              </div>
              <p className="text-xs font-bold text-on-surface-variant leading-relaxed">
                Ingredients sourced within a 40km radius, authenticated by our digital ledger.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Seasonal Recommendations - The Neural Feed */}
      {recommendations.length > 0 && (
        <section className="py-32 md:py-60 bg-surface-container-low border-y border-surface-container-high relative overflow-hidden">
          <div className="max-w-[1600px] mx-auto px-6 md:px-12">
            <motion.div 
              className="flex flex-col md:flex-row md:items-end justify-between mb-20 md:mb-32 gap-10"
              {...fadeInUp}
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-primary font-black uppercase tracking-[0.4em] text-[10px]">
                  <Sparkles className="w-4 h-4" />
                  <span>Neural Recommendations</span>
                </div>
                <h2 className="text-5xl md:text-8xl font-display-accent text-on-surface tracking-tighter leading-[0.85]">
                  Savor the <br />
                  <span className="italic">Selection.</span>
                </h2>
              </div>
              <Link 
                to="/menu" 
                className="group inline-flex items-center gap-4 text-on-surface font-black uppercase text-xs md:text-sm tracking-[0.3em] transition-all"
              >
                <span>Full Collection</span> 
                <div className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                  <ArrowRight className="w-5 h-5 group-hover:text-white transition-colors" />
                </div>
              </Link>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12"
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
            >
              {recommendations.map((plat, idx) => (
                <motion.div key={plat.id} variants={staggerItem}>
                  <Link to={`/menu?plat=${plat.id}`} className={`group relative block ${idx % 2 !== 0 ? 'lg:mt-24' : ''}`}>
                    <div className="aspect-[3/4] rounded-[2rem] overflow-hidden relative shadow-xl bg-surface-container transition-transform duration-700 group-hover:-translate-y-4">
                      {plat.image ? (
                        <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover transition-transform duration-2000 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container-high text-on-surface-variant font-display-accent text-7xl italic opacity-10">
                          {plat.nom.charAt(0)}
                        </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8 text-white">
                        <div className="space-y-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Signature Dish</p>
                          <h3 className="text-3xl font-display-accent italic leading-none">{plat.nom}</h3>
                          <div className="flex items-center justify-between pt-4 border-t border-white/20">
                            <span className="text-lg font-bold font-sans">{plat.prix} DH</span>
                            <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center">
                              <ArrowRight className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Default Label (Visible when not hovered) */}
                    <div className="mt-8 px-4 group-hover:opacity-0 transition-opacity duration-300">
                      <h3 className="text-xl font-sans font-black text-on-surface uppercase tracking-tight line-clamp-1">{plat.nom}</h3>
                      <div className="flex items-center gap-4 mt-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
                        <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-primary" /> {plat.temps_preparation}m</span>
                        <span className="flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-primary" /> Neural Pick</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Guest Journey - Architectural Flow */}
      <section className="py-32 md:py-60 bg-on-surface text-surface relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            <motion.div 
              className="lg:col-span-4 space-y-12"
              {...fadeInUp}
            >
              <div className="space-y-6">
                <span className="editorial-kicker text-primary">Protocol Sequence</span>
                <h2 className="text-5xl md:text-7xl font-display-accent text-white leading-[0.9] tracking-tight">
                  The <br />
                  <span className="italic">Immersive</span> <br />
                  Flow.
                </h2>
              </div>
              <p className="text-xl font-body text-white/50 leading-relaxed max-w-sm">
                Our operations are governed by three core digital protocols, designed to remove friction and amplify presence.
              </p>
              
              <div className="pt-12 hidden lg:block">
                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center animate-bounce">
                  <ChevronDown className="w-6 h-6 text-white/20" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
            >
              {[
                { 
                  icon: Calendar, 
                  title: "Neural Booking", 
                  desc: "Predictive table allocation that aligns with your party's preferred atmosphere and lighting.",
                  num: "01" 
                },
                { 
                  icon: ChefHat, 
                  title: "KDS Sync", 
                  desc: "Direct sub-second telemetry between your preferences and the kitchen line's execution.",
                  num: "02" 
                },
                { 
                  icon: Zap, 
                  title: "QR Finality", 
                  desc: "Redefining settlement. Instant, cryptographic splits without the need for physical hardware.",
                  num: "03" 
                }
              ].map((step, i) => (
                <motion.div 
                  key={i} 
                  className={`p-10 rounded-[3rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-700 group ${i === 1 ? 'md:mt-20' : i === 2 ? 'md:mt-40' : ''}`}
                  variants={staggerItem}
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-10 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    <step.icon className="w-8 h-8" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 block mb-4">{step.num} // Protocol</span>
                  <h3 className="text-3xl font-sans font-bold text-white mb-6 tracking-tight">{step.title}</h3>
                  <p className="text-white/40 font-body text-base leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Atmosphere Gallery - Liquid Grid */}
      <section className="py-32 md:py-60 bg-surface">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <motion.div 
            className="text-center mb-20 md:mb-32 space-y-6"
            {...fadeInUp}
          >
            <span className="editorial-kicker mx-auto">Vibe & Texture</span>
            <h2 className="text-5xl md:text-8xl font-display-accent text-on-surface tracking-tighter leading-[0.85]">
              The Dining <br />
              <span className="italic text-primary">Landscape.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <motion.div 
              className="md:col-span-8 aspect-video rounded-[3rem] overflow-hidden shadow-2xl relative group"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1550966842-28c2e2009aa2?auto=format&fit=crop&q=80&w=1200" 
                alt="Atmosphere" 
                className="w-full h-full object-cover transition-transform duration-2000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-12 left-12 text-white">
                <h4 className="text-4xl font-display-accent italic">Main Atrium.</h4>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mt-4">Casablanca / District 0xAF</p>
              </div>
            </motion.div>

            <motion.div 
              className="md:col-span-4 aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl relative group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1574936145840-28808d77a0b6?auto=format&fit=crop&q=80&w=600" 
                alt="Service" 
                className="w-full h-full object-cover transition-transform duration-2000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-700" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* High-End CTA */}
      <motion.section 
        className="py-32 md:py-60 bg-on-surface relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
        </div>

        <div className="max-w-5xl mx-auto px-6 md:px-12 text-center relative z-10 space-y-16">
          <motion.div 
            className="space-y-8"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-6xl md:text-[9rem] font-display-accent text-white leading-[0.8] tracking-tighter">
              Ready for <br />
              <span className="italic font-light text-primary">Arrival?</span>
            </h2>
            <p className="text-xl md:text-3xl font-body text-white/40 max-w-2xl mx-auto leading-relaxed">
              Reserve your place in our orchestrated landscape of flavor and heritage.
            </p>
          </motion.div>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-10"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <Link 
              to="/register"
              className="px-16 py-6 bg-primary text-white rounded-full font-black uppercase text-sm tracking-[0.4em] transition-all hover:scale-110 hover:shadow-[0_20px_50px_rgba(209,133,78,0.5)] active:scale-95 shadow-2xl"
            >
              Initialize Profile
            </Link>
            <Link 
              to="/menu" 
              className="text-white font-black uppercase text-sm tracking-[0.4em] border-b-2 border-primary pb-2 hover:text-primary transition-all"
            >
              View Collection
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Dynamic Footer Status */}
      <div className="fixed bottom-8 left-12 z-50 hidden xl:flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span>Live Status: High Occupancy</span>
        <div className="w-px h-4 bg-outline-variant/30" />
        <span>Current Region: Casablanca</span>
      </div>
    </div>
  );
};
