import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Clock, ChefHat, Sparkles, MapPin, ShieldCheck, Quote, Calendar } from 'lucide-react';
import { menuApi } from '../../api/menu';
import type { Plat } from '../../api/menu';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] as const }
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  viewport: { once: true, margin: "-100px" }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] as const }
};

export const PortalHomePage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Plat[]>([]);

  useEffect(() => {
    menuApi.getTopRecommendations()
      .then(res => setRecommendations(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="w-full bg-background selection:bg-primary/10 selection:text-primary overflow-x-hidden">
      {/* Hero Section - Editorial Luxury Masterpiece */}
      <section className="relative overflow-hidden min-h-[90dvh] md:min-h-[95dvh] flex items-center pt-20 md:pt-24 pb-12 md:pb-0">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_rgba(0,64,224,0.05),_transparent_50%)]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#0040e0 1px, transparent 1px), linear-gradient(90deg, #0040e0 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>
        
        <div className="max-w-[1600px] mx-auto px-5 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center relative z-10">
          <motion.div 
            className="lg:col-span-7 space-y-8 md:space-y-12"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          >
            <motion.div 
              className="inline-flex items-center gap-3 px-4 md:px-5 py-2 rounded-full glass text-primary text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-4 border border-primary/10"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <Star className="w-3 md:w-3.5 h-3 md:h-3.5 fill-primary" />
              <span>The Intelligent Restaurant OS</span>
            </motion.div>
            
            <motion.h1 
              className="text-5xl sm:text-7xl md:text-9xl font-display-accent italic tracking-tighter leading-[0.9] md:leading-[0.85] text-on-surface"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1, ease: [0.23, 1, 0.32, 1] }}
            >
              Engineered <br/>
              <span className="text-on-surface-variant font-sans not-italic font-black tracking-tight opacity-20">for your</span> <br/>
              <span className="text-primary italic relative">
                Palate.
                <motion.div 
                  className="absolute -bottom-2 md:-bottom-4 left-0 w-full h-1 md:h-1.5 bg-primary/10 rounded-full blur-sm" 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
                />
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-2xl text-on-surface-variant leading-relaxed font-sans font-medium max-w-xl opacity-80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.6, duration: 1 }}
            >
              A sophisticated fusion of ancestral Moroccan culinary art and high-precision digital orchestration.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 md:gap-8 pt-6 md:pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <Link 
                to="/reservations"
                className="group relative inline-flex items-center justify-center gap-4 px-8 md:px-10 py-4 md:py-5 bg-primary text-white rounded-2xl font-bold text-base md:text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span>Reserve a Session</span>
                <ArrowRight className="w-5 md:w-6 h-5 md:h-6 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link 
                to="/menu"
                className="inline-flex items-center justify-center gap-4 px-8 md:px-10 py-4 md:py-5 glass text-on-surface rounded-2xl font-bold text-base md:text-lg transition-all hover:bg-white active:scale-95 border border-surface-container-high shadow-sm"
              >
                Explorer la carte
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="lg:col-span-5 relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="relative group">
                <div className="absolute -inset-10 bg-primary opacity-5 blur-[100px] rounded-full group-hover:opacity-10 transition-opacity duration-1000" />
                <div className="double-bezel p-6 rotate-3 hover:rotate-0 transition-all duration-1000 ease-out-expo relative z-10 bg-white">
                    <div className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-2xl">
                      <img 
                        src="https://picsum.photos/seed/moroccan_luxury/1000/1400" 
                        alt="Signature Plate" 
                        className="w-full h-full object-cover transition-transform duration-2000 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-transparent to-transparent opacity-60" />
                      <div className="absolute bottom-0 left-0 p-12 text-white">
                        <p className="font-display-accent italic text-4xl mb-4 leading-none">Chef's Selection.</p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-[1px] bg-primary" />
                            <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.3em]">Session ID: 402-A</p>
                        </div>
                      </div>
                    </div>
                </div>
                {/* Secondary floating element */}
                <motion.div 
                  className="absolute bottom-6 -left-16 w-64 p-6 glass rounded-[2rem] border border-primary/20 shadow-2xl z-20"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 1 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">AI Match: 98%</span>
                    </div>
                    <p className="text-sm font-bold text-on-surface leading-tight">Matched to your previous flavor profile preference.</p>
                </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Culinary Vision - Editorial Statement */}
      <motion.section 
        className="py-24 md:py-40 bg-surface-container-low border-y border-surface-container-high relative overflow-hidden"
        {...fadeInUp}
      >
         <div className="max-w-[1200px] mx-auto px-5 md:px-8 text-center relative z-10">
            <Quote className="w-10 md:w-16 h-10 md:h-16 text-primary mx-auto mb-8 md:mb-12 opacity-20" />
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-display-accent italic text-on-surface leading-tight tracking-tight mb-12 md:mb-16">
                "We don't just serve food; we engineer sensory memories. <span className="text-on-surface-variant not-italic font-sans font-black opacity-10">Technology is our brush,</span> and the plate is our canvas."
            </h2>
            <div className="flex flex-col items-center gap-4">
                <div className="w-14 md:w-16 h-14 md:h-16 rounded-full bg-surface-container-highest border-2 border-primary/20 overflow-hidden shadow-xl">
                    <img src="https://picsum.photos/seed/chef/200/200" alt="Executive Chef" className="w-full h-full object-cover" />
                </div>
                <div className="text-center">
                    <p className="font-bold text-base md:text-lg text-on-surface font-sans tracking-tight">Executive Chef Hakim</p>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-primary">Master of Architectural Gastronomy</p>
                </div>
            </div>
         </div>
         <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-primary opacity-[0.02] blur-[120px] rounded-full" />
      </motion.section>

      {/* The Intelligence Feed - High-End Catalog */}
      {recommendations.length > 0 && (
        <section className="py-24 md:py-40 relative">
          <div className="max-w-[1600px] mx-auto px-5 md:px-8">
            <motion.div 
              className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-24 gap-8 md:gap-12 text-center md:text-left"
              {...fadeInUp}
            >
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-center md:justify-start gap-3 text-primary font-black uppercase tracking-[0.4em] text-[9px] md:text-[10px]">
                  <Sparkles className="w-4 h-4" />
                  <span>Curated Neural Feed</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-sans font-black text-on-surface tracking-tighter leading-none uppercase italic">AI Recommendations.</h2>
              </div>
              <Link to="/menu" className="text-on-surface font-black uppercase text-[10px] md:text-xs tracking-[0.3em] border-b-4 border-primary/20 pb-2 hover:border-primary transition-all inline-flex items-center justify-center md:justify-start gap-4 group">
                Browse Full Catalog <ArrowRight className="w-5 md:w-6 h-5 md:h-6 transition-transform group-hover:translate-x-2 text-primary" />
              </Link>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10"
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true, margin: "-100px" }}
            >
              {recommendations.map((plat, idx) => (
                <motion.div key={plat.id} variants={staggerItem}>
                  <Link to={`/menu?plat=${plat.id}`} className={`block double-bezel p-4 group transition-all duration-700 hover:scale-[1.05] hover:shadow-[0px_40px_80px_rgba(0,64,224,0.08)] ${idx % 2 !== 0 ? 'lg:translate-y-12' : ''}`}>
                    <div className="aspect-[1/1.2] rounded-xl overflow-hidden mb-6 md:mb-8 relative bg-surface-container-low">
                      {plat.image ? (
                        <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover transition-transform duration-2000 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container text-on-surface-variant font-bold text-4xl md:text-6xl italic font-display-accent opacity-20">
                          {plat.nom.charAt(0)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity duration-700" />
                      <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 right-4 md:right-6 glass p-4 md:p-5 rounded-2xl flex items-center justify-between shadow-2xl border border-white/20">
                        <div className="flex flex-col">
                          <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-primary mb-0.5 md:mb-1">Price Point</span>
                          <span className="text-base md:text-lg font-bold text-on-surface font-sans">{plat.prix} DH</span>
                        </div>
                        <div className="w-8 md:w-10 h-8 md:h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                          <ArrowRight className="w-4 md:w-5 h-4 md:h-5" />
                        </div>
                      </div>
                    </div>
                    <div className="px-2 md:px-4 pb-2 md:pb-4">
                      <h3 className="font-sans font-black text-xl md:text-2xl text-on-surface mb-2 md:mb-3 group-hover:text-primary transition-colors line-clamp-1 tracking-tighter uppercase">{plat.nom}</h3>
                      <div className="flex items-center gap-4 md:gap-6 text-[9px] md:text-[10px] text-on-surface-variant font-black uppercase tracking-[0.2em] opacity-50">
                          <span className="flex items-center gap-2"><Clock className="w-3.5 md:w-4 h-3.5 md:h-4 text-primary" /> {plat.temps_preparation} MIN</span>
                          <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 md:w-4 h-3.5 md:h-4 text-primary" /> Verified</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Architectural Flow - How it works */}
      <section className="py-24 md:py-40 bg-on-surface text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-[1600px] mx-auto px-5 md:px-8 relative z-10">
          <motion.div 
            className="max-w-3xl mb-16 md:mb-32 space-y-6 md:space-y-8 text-center md:text-left"
            {...fadeInUp}
          >
            <h2 className="text-4xl sm:text-6xl md:text-8xl font-display-accent italic tracking-tighter leading-none">The Architectural Flow.</h2>
            <p className="text-base md:text-xl text-white/50 leading-relaxed font-sans font-medium max-w-xl mx-auto md:mx-0 uppercase tracking-widest text-[9px] md:text-[10px] font-black">Synthesizing luxury and precision in 3 distinct protocols.</p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div className="space-y-6 md:space-y-10 group text-center md:text-left" variants={staggerItem}>
              <div className="w-20 md:w-24 h-20 md:h-24 mx-auto md:mx-0 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-primary transition-all duration-700 group-hover:bg-primary group-hover:text-white group-hover:scale-110 shadow-2xl">
                <Calendar className="w-8 md:w-10 h-8 md:h-10" />
              </div>
              <div className="space-y-4 md:space-y-6">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-primary">Protocol 01</span>
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight font-sans">Neural Booking.</h3>
                <p className="text-white/40 font-medium leading-relaxed font-sans text-base md:text-lg">
                  Secure your placement through our AI-assisted wizard. Real-time availability mapped to architectural precision.
                </p>
              </div>
            </motion.div>

            <motion.div className="space-y-6 md:space-y-10 group md:translate-y-20 text-center md:text-left" variants={staggerItem}>
              <div className="w-20 md:w-24 h-20 md:h-24 mx-auto md:mx-0 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-primary transition-all duration-700 group-hover:bg-primary group-hover:text-white group-hover:scale-110 shadow-2xl">
                <ChefHat className="w-8 md:w-10 h-8 md:h-10" />
              </div>
              <div className="space-y-4 md:space-y-6">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-primary">Protocol 02</span>
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight font-sans">KDS Orchestration.</h3>
                <p className="text-white/40 font-medium leading-relaxed font-sans text-base md:text-lg">
                  Direct telemetry link between your table and our master chefs. Surgical timing for every course served.
                </p>
              </div>
            </motion.div>

            <motion.div className="space-y-6 md:space-y-10 group md:translate-y-40 text-center md:text-left" variants={staggerItem}>
              <div className="w-20 md:w-24 h-20 md:h-24 mx-auto md:mx-0 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-primary transition-all duration-700 group-hover:bg-primary group-hover:text-white group-hover:scale-110 shadow-2xl">
                <ShieldCheck className="w-8 md:w-10 h-8 md:h-10" />
              </div>
              <div className="space-y-4 md:space-y-6">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-primary">Protocol 03</span>
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight font-sans">QR Settlement.</h3>
                <p className="text-white/40 font-medium leading-relaxed font-sans text-base md:text-lg">
                  Instantaneous, frictionless payment splits. No hardware, no friction, just pure cryptographic finality.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
        <div className="h-[100px] md:h-[200px]" />
      </section>

      {/* Atmosphere - The Grid */}
      <section className="py-24 md:py-40">
        <div className="max-w-[1600px] mx-auto px-5 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-stretch">
                <motion.div 
                  className="md:col-span-8 double-bezel p-3 md:p-4 bg-white"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                >
                    <div className="relative rounded-2xl overflow-hidden h-full min-h-[400px] md:min-h-[500px]">
                        <img src="https://picsum.photos/seed/restaurant_interior/1200/800" alt="Atmosphere" className="w-full h-full object-cover transition-transform duration-2000 hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 text-white">
                            <h4 className="text-3xl md:text-5xl font-display-accent italic mb-2">The Dining Hub.</h4>
                            <p className="text-white/60 font-black uppercase tracking-[0.3em] text-[8px] md:text-[10px]">Casablanca, Signature Location</p>
                        </div>
                    </div>
                </motion.div>
                <div className="md:col-span-4 flex flex-col gap-6 md:gap-8">
                    <motion.div 
                      className="flex-1 double-bezel p-3 md:p-4 bg-white hidden sm:block"
                      initial={{ opacity: 0, y: -30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="relative rounded-2xl overflow-hidden h-full min-h-[250px]">
                            <img src="https://picsum.photos/seed/moroccan_tea/600/400" alt="Service" className="w-full h-full object-cover" />
                        </div>
                    </motion.div>
                    <motion.div 
                      className="flex-1 bg-primary rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 text-white flex flex-col justify-center gap-4 md:gap-6 shadow-2xl shadow-primary/20"
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <h4 className="text-2xl md:text-3xl font-bold font-sans tracking-tight leading-none uppercase italic font-black">Secured Excellence.</h4>
                        <p className="text-white/70 font-medium leading-relaxed font-sans text-xs md:text-sm">Every element of your visit is tracked and optimized by our Tastify OS, ensuring a zero-defect experience.</p>
                        <div className="flex items-center gap-3 pt-2 md:pt-4">
                            <MapPin className="w-4 md:w-5 h-4 md:h-5 text-white/50" />
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Global Standard Certified</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
      </section>

      {/* Final CTA */}
      <motion.section 
        className="py-24 md:py-40 bg-surface-container-lowest relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <div className="max-w-5xl mx-auto px-5 md:px-8 text-center relative z-10">
            <motion.h2 
              className="text-4xl sm:text-6xl md:text-8xl font-display-accent italic text-on-surface mb-8 md:mb-12 leading-none"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            >
              Ready for the <br/><span className="text-primary">Experience?</span>
            </motion.h2>
            <motion.p 
              className="text-lg md:text-2xl text-on-surface-variant font-medium mb-12 md:mb-20 max-w-2xl mx-auto opacity-70"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.7 }}
              transition={{ delay: 0.2, duration: 1 }}
            >
              Join our exclusive community of culinary enthusiasts and experience the future of dining.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-6 md:gap-10 max-w-md mx-auto sm:max-w-none"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
                <Link 
                    to="/register" 
                    className="px-8 md:px-16 py-4 md:py-6 bg-primary text-white rounded-2xl font-black uppercase text-xs md:text-sm tracking-[0.3em] transition-all hover:scale-110 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 shadow-lg shadow-primary/10"
                >
                    Create Free Account
                </Link>
                <Link to="/menu" className="text-on-surface font-black uppercase text-[10px] md:text-sm tracking-[0.3em] border-b-2 border-primary/20 pb-1 hover:border-primary transition-all">Explore the Menu</Link>
            </motion.div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-primary/10 -rotate-12" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-primary/10 rotate-12" />
      </motion.section>
    </div>
  );
};

