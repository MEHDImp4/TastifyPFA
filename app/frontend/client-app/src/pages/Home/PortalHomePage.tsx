import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Clock, ChefHat, Sparkles, MapPin, ShieldCheck, Quote, Calendar } from 'lucide-react';
import { menuApi } from '../../api/menu';
import type { Plat } from '../../api/menu';

export const PortalHomePage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Plat[]>([]);

  useEffect(() => {
    menuApi.getTopRecommendations()
      .then(res => setRecommendations(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="w-full bg-background animate-in fade-in duration-1000 selection:bg-primary/10 selection:text-primary overflow-x-hidden">
      {/* Hero Section - Editorial Luxury Masterpiece */}
      <section className="relative overflow-hidden min-h-[90dvh] md:min-h-[95dvh] flex items-center pt-20 md:pt-24 pb-12 md:pb-0">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_rgba(0,64,224,0.05),_transparent_50%)]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#0040e0 1px, transparent 1px), linear-gradient(90deg, #0040e0 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>
        
        <div className="max-w-[1600px] mx-auto px-5 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center relative z-10">
          <div className="lg:col-span-7 space-y-8 md:space-y-12">
            <div className="inline-flex items-center gap-3 px-4 md:px-5 py-2 rounded-full glass text-primary text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-4 border border-primary/10 animate-in slide-in-from-left-4 duration-700">
              <Star className="w-3 md:w-3.5 h-3 md:h-3.5 fill-primary" />
              <span>The Intelligent Restaurant OS</span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-display-accent italic tracking-tighter leading-[0.9] md:leading-[0.85] text-on-surface animate-in slide-in-from-left-8 duration-1000">
              Engineered <br/>
              <span className="text-on-surface-variant font-sans not-italic font-black tracking-tight opacity-20">for your</span> <br/>
              <span className="text-primary italic relative">
                Palate.
                <div className="absolute -bottom-2 md:-bottom-4 left-0 w-full h-1 md:h-1.5 bg-primary/10 rounded-full blur-sm" />
              </span>
            </h1>
            
            <p className="text-lg md:text-2xl text-on-surface-variant leading-relaxed font-sans font-medium max-w-xl opacity-80 animate-in slide-in-from-left-12 duration-1000 delay-200">
              A sophisticated fusion of ancestral Moroccan culinary art and high-precision digital orchestration.
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 md:gap-8 pt-6 md:pt-8 animate-in slide-in-from-bottom-8 duration-1000 delay-500">
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
            </div>
          </div>
          
          <div className="lg:col-span-5 relative hidden lg:block animate-in zoom-in-95 duration-1000 delay-300">
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
                <div className="absolute bottom-6 -left-16 w-64 p-6 glass rounded-[2rem] border border-primary/20 shadow-2xl z-20 animate-in slide-in-from-bottom-12 duration-1000 delay-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">AI Match: 98%</span>
                    </div>
                    <p className="text-sm font-bold text-on-surface leading-tight">Matched to your previous flavor profile preference.</p>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Culinary Vision - Editorial Statement */}
      <section className="py-24 md:py-40 bg-surface-container-low border-y border-surface-container-high relative overflow-hidden">
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
      </section>

      {/* The Intelligence Feed - High-End Catalog */}
      {recommendations.length > 0 && (
        <section className="py-24 md:py-40 relative">
          <div className="max-w-[1600px] mx-auto px-5 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-24 gap-8 md:gap-12 text-center md:text-left">
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
              {recommendations.map((plat, idx) => (
                <Link to={`/menu?plat=${plat.id}`} key={plat.id} className={`double-bezel p-4 group transition-all duration-700 hover:scale-[1.05] hover:shadow-[0px_40px_80px_rgba(0,64,224,0.08)] ${idx % 2 !== 0 ? 'lg:translate-y-12' : ''}`}>
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
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Architectural Flow - How it works */}
      <section className="py-24 md:py-40 bg-on-surface text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-[1600px] mx-auto px-5 md:px-8 relative z-10">
          <div className="max-w-3xl mb-16 md:mb-32 space-y-6 md:space-y-8 text-center md:text-left">
            <h2 className="text-4xl sm:text-6xl md:text-8xl font-display-accent italic tracking-tighter leading-none">The Architectural Flow.</h2>
            <p className="text-base md:text-xl text-white/50 leading-relaxed font-sans font-medium max-w-xl mx-auto md:mx-0 uppercase tracking-widest text-[9px] md:text-[10px] font-black">Synthesizing luxury and precision in 3 distinct protocols.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20">
            <div className="space-y-6 md:space-y-10 group text-center md:text-left">
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
            </div>

            <div className="space-y-6 md:space-y-10 group md:translate-y-20 text-center md:text-left">
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
            </div>

            <div className="space-y-6 md:space-y-10 group md:translate-y-40 text-center md:text-left">
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
            </div>
          </div>
        </div>
        <div className="h-[100px] md:h-[200px]" />
      </section>

      {/* Atmosphere - The Grid */}
      <section className="py-24 md:py-40">
        <div className="max-w-[1600px] mx-auto px-5 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-stretch">
                <div className="md:col-span-8 double-bezel p-3 md:p-4 bg-white">
                    <div className="relative rounded-2xl overflow-hidden h-full min-h-[400px] md:min-h-[500px]">
                        <img src="https://picsum.photos/seed/restaurant_interior/1200/800" alt="Atmosphere" className="w-full h-full object-cover transition-transform duration-2000 hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 text-white">
                            <h4 className="text-3xl md:text-5xl font-display-accent italic mb-2">The Dining Hub.</h4>
                            <p className="text-white/60 font-black uppercase tracking-[0.3em] text-[8px] md:text-[10px]">Casablanca, Signature Location</p>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-4 flex flex-col gap-6 md:gap-8">
                    <div className="flex-1 double-bezel p-3 md:p-4 bg-white hidden sm:block">
                        <div className="relative rounded-2xl overflow-hidden h-full min-h-[250px]">
                            <img src="https://picsum.photos/seed/moroccan_tea/600/400" alt="Service" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <div className="flex-1 bg-primary rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 text-white flex flex-col justify-center gap-4 md:gap-6 shadow-2xl shadow-primary/20">
                        <h4 className="text-2xl md:text-3xl font-bold font-sans tracking-tight leading-none uppercase italic font-black">Secured Excellence.</h4>
                        <p className="text-white/70 font-medium leading-relaxed font-sans text-xs md:text-sm">Every element of your visit is tracked and optimized by our Tastify OS, ensuring a zero-defect experience.</p>
                        <div className="flex items-center gap-3 pt-2 md:pt-4">
                            <MapPin className="w-4 md:w-5 h-4 md:h-5 text-white/50" />
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Global Standard Certified</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-40 bg-surface-container-lowest relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 md:px-8 text-center relative z-10">
            <h2 className="text-4xl sm:text-6xl md:text-8xl font-display-accent italic text-on-surface mb-8 md:mb-12 leading-none">Ready for the <br/><span className="text-primary">Experience?</span></h2>
            <p className="text-lg md:text-2xl text-on-surface-variant font-medium mb-12 md:mb-20 max-w-2xl mx-auto opacity-70">Join our exclusive community of culinary enthusiasts and experience the future of dining.</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-6 md:gap-10 max-w-md mx-auto sm:max-w-none">
                <Link 
                    to="/register" 
                    className="px-8 md:px-16 py-4 md:py-6 bg-primary text-white rounded-2xl font-black uppercase text-xs md:text-sm tracking-[0.3em] transition-all hover:scale-110 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 shadow-lg shadow-primary/10"
                >
                    Create Free Account
                </Link>
                <Link to="/menu" className="text-on-surface font-black uppercase text-[10px] md:text-sm tracking-[0.3em] border-b-2 border-primary/20 pb-1 hover:border-primary transition-all">Explore the Menu</Link>
            </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-primary/10 -rotate-12" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-primary/10 rotate-12" />
      </section>
    </div>
  );
};
