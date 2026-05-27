import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  ArrowRight,
  Share2,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Quote
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { menuApi } from '../../api/menu';
import { useConfigStore } from '../../store/configStore';
import type { Plat } from '../../api/menu';

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
    <div className="h-full bg-[#FAF9F6] text-[#2D2424] selection:bg-[#C5A059]/20 overflow-y-auto custom-scrollbar font-body scroll-smooth">
      
      {/* Luminous Editorial Hero */}
      <section className="relative min-h-[90vh] w-full flex flex-col justify-center overflow-hidden shrink-0 bg-[#F4F1EA]">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2000" 
            alt="Warm Dining Atmosphere" 
            className="w-full h-full object-cover opacity-40 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F4F1EA]/40 to-[#FAF9F6]"></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto text-center px-6">
          <motion.div
             initial={{ opacity: 0, y: 40 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1.6, ease: [0.23, 1, 0.32, 1] }}
             className="space-y-10"
          >
            <div className="flex items-center justify-center gap-4">
                <div className="h-[1px] w-12 bg-[#C5A059]/40" />
                <span className="font-sans text-[11px] font-black uppercase tracking-[0.4em] text-[#C5A059]">Maison de Saveurs</span>
                <div className="h-[1px] w-12 bg-[#C5A059]/40" />
            </div>

            <h1 className="text-6xl md:text-[100px] leading-[0.9] tracking-tighter font-serif italic text-[#2D2424]">
              {config?.nom ? config.nom : "Tastify"} <br/>
              <span className="not-italic text-[#D14D1A]">L’Inspiration.</span>
            </h1>

            <div className="max-w-2xl mx-auto">
                <p className="text-xl md:text-2xl font-serif italic text-[#2D2424]/70 leading-relaxed">
                   "Une table marocaine contemporaine où chaque plat raconte une histoire de terroir et d'élégance."
                </p>
            </div>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 1.2 }}
                className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-6"
            >
                <Link 
                to="/menu" 
                className="px-14 py-6 bg-[#2D2424] text-[#FAF9F6] rounded-full font-sans text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:bg-[#D14D1A] hover:scale-105 active:scale-95 shadow-2xl"
                >
                Explorer le Menu
                </Link>
                <Link 
                to="/reservations" 
                className="px-14 py-6 border border-[#2D2424]/20 text-[#2D2424] rounded-full font-sans text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:bg-[#2D2424]/5 active:scale-95"
                >
                Réserver une table
                </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* AI Sentiment-Driven Recommendations */}
      <section className="py-32 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-client-margin">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-24 gap-8">
            <div className="text-center md:text-left space-y-4">
              <div className="flex items-center justify-center md:justify-start gap-3">
                 <Sparkles className="w-5 h-5 text-[#C5A059]" />
                 <span className="font-sans text-[10px] font-black uppercase tracking-[0.5em] text-[#C5A059]">TOP TENDANCES IA</span>
              </div>
              <h3 className="font-serif text-5xl md:text-6xl text-[#2D2424] italic tracking-tight">Vos Coups de Cœur</h3>
              <p className="font-body text-sm text-[#2D2424]/60 uppercase tracking-widest">Plats les plus appréciés selon vos retours</p>
            </div>
            <Link to="/menu" className="font-sans text-[10px] font-black uppercase tracking-[0.4em] text-[#D14D1A] border-b border-[#D14D1A]/20 pb-2 hover:border-[#D14D1A] transition-all">
                Voir toute la carte
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            {isLoading ? [1, 2].map(i => (
               <div key={i} className="aspect-video bg-[#F4F1EA] animate-pulse rounded-[3rem]" />
            )) : topDishes.map((dish, idx) => (
              <motion.div 
                key={dish.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2, duration: 1 }}
                className="group relative"
              >
                {/* Ranking Badge */}
                <div className="absolute -top-6 -left-6 z-20 w-16 h-16 bg-[#2D2424] rounded-full flex items-center justify-center border-4 border-[#FAF9F6] shadow-xl">
                   <span className="font-serif text-2xl font-black italic text-[#FAF9F6]">#0{idx + 1}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                    {/* Visual */}
                    <div className="lg:col-span-6 relative aspect-square overflow-hidden rounded-[2.5rem] bg-[#F4F1EA] shadow-2xl transition-all duration-700 group-hover:scale-[1.02]">
                        {dish.image ? (
                            <img src={dish.image} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" alt={dish.nom} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-serif italic text-6xl text-[#2D2424]/5">{dish.nom.charAt(0)}</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#2D2424]/60 via-transparent to-transparent opacity-40" />
                        
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="bg-[#FAF9F6]/95 backdrop-blur-sm p-4 rounded-2xl flex items-center justify-between shadow-lg">
                                <div className="flex items-center gap-2 text-[#D14D1A]">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="font-sans text-[10px] font-black uppercase tracking-widest">Tendances</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-sans text-xs font-black text-[#2D2424]">Taux de satisfaction élevé</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content & Reviews */}
                    <div className="lg:col-span-6 space-y-8">
                        <div>
                            <h4 className="font-serif text-3xl font-black text-[#2D2424] uppercase tracking-tight group-hover:text-[#D14D1A] transition-colors">{dish.nom}</h4>
                            <p className="font-body text-sm text-[#2D2424]/60 mt-2 uppercase tracking-[0.2em]">{config?.devise || 'DH'} {parseFloat(dish.prix).toFixed(0)}</p>
                        </div>

                        {/* Guest Feedback Carousel-like display */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-[#C5A059]">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span className="font-sans text-[9px] font-black uppercase tracking-[0.3em]">Retours des Convives</span>
                            </div>
                            
                            <div className="space-y-4">
                                {dish.top_avis && dish.top_avis.length > 0 ? dish.top_avis.slice(0, 2).map((avis, i) => (
                                    <motion.div 
                                        key={avis.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + (i * 0.1) }}
                                        className="relative pl-6 border-l border-[#2D2424]/10"
                                    >
                                        <Quote className="absolute -left-3 -top-2 w-4 h-4 text-[#C5A059]/20" />
                                        <p className="text-sm font-body italic text-[#2D2424]/80 line-clamp-2 leading-relaxed">
                                            "{avis.commentaire}"
                                        </p>
                                        <div className="mt-2">
                                            <span className="text-[10px] font-sans font-bold text-[#C5A059] uppercase">@{avis.user_username}</span>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <p className="text-xs font-body italic text-[#2D2424]/40">Soyez le premier à partager votre expérience sur ce plat.</p>
                                )}
                            </div>
                        </div>

                        <Link 
                            to="/menu"
                            className="inline-flex items-center gap-4 py-4 px-8 bg-[#FAF9F6] border border-[#2D2424]/10 rounded-full font-sans text-[10px] font-black uppercase tracking-[0.3em] text-[#2D2424] hover:bg-[#2D2424] hover:text-[#FAF9F6] transition-all group/btn"
                        >
                            Détails <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Immersive Experience Section */}
      <section className="py-24 px-6 md:px-12 bg-[#F4F1EA]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative group">
                <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl relative z-10 border-8 border-[#FAF9F6]">
                    <img 
                        src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1200" 
                        className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000"
                        alt="Restaurant Detail"
                    />
                </div>
                {/* Floating Detail */}
                <motion.div 
                    initial={{ x: 40, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    className="absolute -bottom-10 -right-10 bg-[#2D2424] text-[#FAF9F6] p-10 rounded-[2rem] shadow-2xl z-20 hidden md:block max-w-xs"
                >
                    <h5 className="font-serif text-2xl italic mb-3">L'Art du Service.</h5>
                    <p className="font-body text-sm opacity-70 leading-relaxed">Chaque geste est une chorégraphie, chaque détail une attention particulière pour votre confort.</p>
                </motion.div>
            </div>

            <div className="space-y-12">
                <div className="space-y-6">
                    <span className="font-sans text-[10px] font-black uppercase tracking-[0.5em] text-[#D14D1A]">NOTRE PHILOSOPHIE</span>
                    <h2 className="font-serif text-5xl md:text-6xl text-[#2D2424] leading-tight tracking-tight italic">Bienvenue dans notre <br/> <span className="not-italic text-[#2D2424] font-black uppercase">Sanctuaire.</span></h2>
                    <p className="text-lg font-body text-[#2D2424]/80 leading-relaxed font-medium">
                        Situé au cœur de la ville, notre établissement est une invitation à la déconnexion. Ici, le temps ralentit pour laisser place à la dégustation et au partage.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-8 border-t border-[#2D2424]/10 pt-10">
                    <div className="space-y-2">
                        <span className="font-serif text-3xl italic text-[#C5A059]">01.</span>
                        <h6 className="font-sans text-[10px] font-black uppercase tracking-widest text-[#2D2424]">Sourcing Local</h6>
                        <p className="text-xs text-[#2D2424]/60 font-medium">Produits frais de nos coopératives locales.</p>
                    </div>
                    <div className="space-y-2">
                        <span className="font-serif text-3xl italic text-[#C5A059]">02.</span>
                        <h6 className="font-sans text-[10px] font-black uppercase tracking-widest text-[#2D2424]">Haute Couture</h6>
                        <p className="text-xs text-[#2D2424]/60 font-medium">Une cuisine de précision, dressée à la main.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Final CTA - Luminous Minimal */}
      <section className="py-40 bg-[#FAF9F6] text-center px-6">
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto space-y-16"
        >
            <h2 className="font-serif text-6xl md:text-8xl text-[#2D2424] italic leading-none tracking-tighter">Votre table <br/> vous attend.</h2>
            <Link to="/reservations" className="inline-flex items-center gap-8 px-20 py-8 bg-[#D14D1A] text-[#FAF9F6] rounded-full font-sans text-xs font-black uppercase tracking-[0.5em] hover:scale-105 active:scale-95 transition-all shadow-2xl group">
                Réserver maintenant
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}>
                    <Sparkles className="w-5 h-5 text-[#FAF9F6]/50" />
                </motion.div>
            </Link>
        </motion.div>
      </section>

      {/* Editorial Footer - Luminous Minimal */}
      <footer className="pt-32 pb-16 px-6 md:px-12 border-t border-[#2D2424]/10 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-20 mb-28">
          <div className="md:col-span-4 space-y-12">
            <div className="space-y-6">
                <Link to="/" className="inline-block">
                    <h1 className="font-serif text-4xl font-black text-[#2D2424] italic tracking-tighter leading-none m-0">
                        {config?.nom || "Tastify."}
                    </h1>
                </Link>
                <p className="text-base font-body text-[#2D2424]/70 leading-relaxed italic font-medium">
                   {config?.description || "Une hospitalité marocaine contemporaine, servie avec précision et simplicité."}
                </p>
            </div>
            
            <div className="flex gap-4">
                {[Share2, Sparkles, MapPin].map((Icon, i) => (
                    <a key={i} href="#" className="w-10 h-10 rounded-full border border-[#2D2424]/10 flex items-center justify-center text-[#2D2424]/40 hover:text-[#D14D1A] hover:border-[#D14D1A] transition-all duration-300">
                        <Icon className="w-4 h-4" />
                    </a>
                ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            <span className="font-sans text-[9px] font-black uppercase tracking-[0.4em] text-[#C5A059]">NAVIGATION</span>
            <ul className="space-y-4">
              <li><Link to="/menu" className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2424]/60 hover:text-[#2D2424] transition-colors">Carte Digitale</Link></li>
              <li><Link to="/reservations" className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2424]/60 hover:text-[#2D2424] transition-colors">Réservations</Link></li>
              <li><Link to="/loyalty" className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2424]/60 hover:text-[#2D2424] transition-colors">L'Échelon</Link></li>
              <li><Link to="/contact" className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2424]/60 hover:text-[#2D2424] transition-colors">Concierge</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-8">
            <span className="font-sans text-[9px] font-black uppercase tracking-[0.4em] text-[#C5A059]">HORAIRES</span>
            <div className="space-y-4 font-sans text-[10px] font-black uppercase tracking-[0.2em] text-[#2D2424]">
              {config?.horaires && Object.keys(config.horaires).length > 0 ? (
                Object.entries(config.horaires).map(([day, hours]) => (
                  <div key={day} className="flex justify-between border-b border-[#2D2424]/5 pb-2">
                    <span className="opacity-50">{day}</span> 
                    <span>{hours}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between border-b border-[#2D2424]/5 pb-2">
                    <span className="opacity-50">LUN — VEN</span> 
                    <span>12:00 — 23:00</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2D2424]/5 pb-2">
                    <span className="opacity-50">SAM — DIM</span> 
                    <span>11:00 — 00:00</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="md:col-span-3 space-y-8 text-right">
            <span className="font-sans text-[9px] font-black uppercase tracking-[0.4em] text-[#C5A059]">NOUS TROUVER</span>
            <div className="space-y-6">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2D2424] leading-loose">
                  {config?.adresse || "Boulevard d'Anfa, Quartier Racine, Casablanca 20250"}
                </p>
                {config?.telephone && <p className="text-[12px] font-mono font-bold text-[#D14D1A]">{config.telephone}</p>}
                {config?.email && <p className="text-[10px] font-black text-[#2D2424] uppercase tracking-widest">{config.email}</p>}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-16 border-t border-[#2D2424]/10 flex flex-col md:flex-row justify-between items-center gap-10">
          <span className="font-sans text-[9px] font-black uppercase tracking-[0.5em] text-[#2D2424]/20">
              © {new Date().getFullYear()} {config?.nom?.toUpperCase() || "TASTIFY"} SYSTEM — DESIGN BY GSD
          </span>
          <div className="flex gap-10">
             <Link to="/login" className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2D2424]/40 hover:text-[#2D2424] transition-all">
                Terminal Staff
             </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
