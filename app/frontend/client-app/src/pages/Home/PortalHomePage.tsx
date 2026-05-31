import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  MessageSquare,
  TrendingUp,
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
    <div className="h-full bg-background text-on-background overflow-y-auto custom-scrollbar font-body scroll-smooth">
      
      {/* Atelier Minimal Hero */}
      <section className="relative min-h-[85vh] w-full flex flex-col justify-center border-b border-outline">
        <div className="max-w-[1200px] mx-auto w-full px-client-margin py-32 grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
             className="lg:col-span-7 space-y-10"
          >
            <div className="flex items-center gap-3">
                <span className="text-ui-label text-on-surface-variant">L'Atelier Culinaire</span>
            </div>

            <h1 className="text-display-lg">
              {config?.nom ? config.nom : "Tastify"} <br/>
              <span className="text-on-surface-variant">Pureté & Saveur.</span>
            </h1>

            <div className="max-w-xl">
                <p className="text-xl text-on-surface-variant leading-relaxed font-serif italic">
                   "Une table marocaine contemporaine où chaque plat raconte une histoire de terroir et d'élégance minimaliste."
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Link to="/menu" className="btn-primary">
                Explorer la Carte
                </Link>
                <Link to="/reservations" className="btn-secondary">
                Réserver une table
                </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="lg:col-span-5 hidden lg:block"
          >
            <div className="aspect-[4/5] bg-surface-container-high rounded-xl overflow-hidden border border-outline relative group">
                <img 
                    src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200" 
                    alt="Atmosphere" 
                    className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-primary/5 mix-blend-overlay"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recommended Selection - Clean Bento */}
      <section className="py-32">
        <div className="max-w-[1200px] mx-auto px-client-margin">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-on-surface-variant">
                 <Sparkles className="w-4 h-4" />
                 <span className="text-ui-label">Sélection du Moment</span>
              </div>
              <h3 className="text-headline-md italic font-serif">Inspirations de Saison</h3>
            </div>
            <Link to="/menu" className="text-ui-label text-on-background border-b border-outline pb-1 hover:border-on-background transition-all">
                Voir toute la carte
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {isLoading ? [1, 2].map(i => (
               <div key={i} className="aspect-[16/9] bg-surface-container-high animate-pulse rounded-xl border border-outline" />
            )) : topDishes.map((dish, idx) => (
              <motion.div 
                key={dish.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="atelier-card p-8 group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-10">
                    <span className="font-mono text-sm opacity-20 group-hover:opacity-100 transition-opacity">0{idx + 1}</span>
                    <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full border border-outline">
                        <TrendingUp className="w-3 h-3 text-success" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Tendance</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center flex-1">
                    <div className="lg:col-span-5">
                        <div className="aspect-square rounded-lg overflow-hidden border border-outline grayscale group-hover:grayscale-0 transition-all duration-700">
                            {dish.image ? (
                                <img src={dish.image} className="w-full h-full object-cover" alt={dish.nom} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-surface-container-high text-on-surface-variant/20 font-serif italic text-4xl">{dish.nom.charAt(0)}</div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-7 space-y-6">
                        <div>
                            <h4 className="text-xl font-medium tracking-tight mb-1">{dish.nom}</h4>
                            <p className="font-mono text-xs text-on-surface-variant">{config?.devise || 'DH'} {parseFloat(dish.prix).toFixed(0)}</p>
                        </div>

                        <div className="space-y-4">
                            {dish.top_avis && dish.top_avis.length > 0 ? (
                                <div className="pl-4 border-l border-outline">
                                    <p className="text-xs text-on-surface-variant italic leading-relaxed line-clamp-2">
                                        "{dish.top_avis[0].commentaire}"
                                    </p>
                                </div>
                            ) : (
                                <p className="text-[10px] text-on-surface-variant/40 uppercase tracking-widest">Nouvelle Création</p>
                            )}
                        </div>

                        <Link 
                            to="/menu"
                            className="inline-flex items-center gap-2 text-ui-label text-on-surface-variant hover:text-on-background transition-colors group/btn"
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

      {/* Philosophy - Clean Split */}
      <section className="py-32 bg-surface border-y border-outline">
        <div className="max-w-[1200px] mx-auto px-client-margin grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="aspect-[4/5] rounded-xl overflow-hidden border border-outline relative">
                <img 
                    src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1200" 
                    className="w-full h-full object-cover grayscale"
                    alt="Philosophy"
                />
            </div>

            <div className="space-y-12">
                <div className="space-y-6">
                    <span className="text-ui-label text-on-surface-variant">Philosophie</span>
                    <h2 className="text-display-lg leading-[1.1]">Le Goût de <br/> l'Essentiel.</h2>
                    <p className="text-lg text-on-surface-variant leading-relaxed">
                        Chaque geste est une chorégraphie, chaque détail une attention particulière. Nous croyons en une hospitalité qui s'exprime dans le silence et la précision.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-12 pt-12 border-t border-outline">
                    <div className="space-y-2">
                        <span className="font-mono text-xs text-on-surface-variant">01.</span>
                        <h6 className="text-ui-label text-on-background">Sourcing</h6>
                        <p className="text-xs text-on-surface-variant">Produits issus de coopératives locales sélectionnées.</p>
                    </div>
                    <div className="space-y-2">
                        <span className="font-mono text-xs text-on-surface-variant">02.</span>
                        <h6 className="text-ui-label text-on-background">Précision</h6>
                        <p className="text-xs text-on-surface-variant">Une cuisine de terroir, dressée avec rigueur.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Final CTA - Quiet Sophistication */}
      <section className="py-48 text-center px-6">
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-16"
        >
            <h2 className="text-display-lg italic">Une invitation à la sérénité.</h2>
            <Link to="/reservations" className="btn-primary mx-auto w-fit px-20">
                Réserver votre table
            </Link>
        </motion.div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-24 px-client-margin border-t border-outline">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
          <div className="md:col-span-5 space-y-8">
                <Link to="/" className="inline-block">
                    <h2 className="text-3xl font-serif italic text-on-background lowercase tracking-tighter">
                        {config?.nom || "tastify."}
                    </h2>
                </Link>
                <p className="text-sm text-on-surface-variant leading-relaxed max-w-sm">
                   {config?.description || "Une hospitalité contemporaine, servie avec précision et simplicité au coeur de la ville."}
                </p>
          </div>

          <div className="md:col-span-2 space-y-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Menu</span>
            <ul className="space-y-3">
              <li><Link to="/menu" className="text-xs text-on-surface-variant hover:text-on-background transition-colors">La Carte</Link></li>
              <li><Link to="/reservations" className="text-xs text-on-surface-variant hover:text-on-background transition-colors">Réservations</Link></li>
              <li><Link to="/loyalty" className="text-xs text-on-surface-variant hover:text-on-background transition-colors">Le Club</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Horaires</span>
            <div className="space-y-3 text-xs text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>LUN — VEN</span> 
                    <span>12:00 — 23:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SAM — DIM</span> 
                    <span>11:00 — 00:00</span>
                  </div>
            </div>
          </div>

          <div className="md:col-span-3 space-y-6 text-right">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Contact</span>
            <div className="space-y-4">
                <p className="text-xs text-on-surface-variant leading-loose">
                  {config?.adresse || "Boulevard d'Anfa, Racine, Casablanca"}
                </p>
                {config?.telephone && <p className="text-sm font-mono font-medium">{config.telephone}</p>}
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto pt-12 border-t border-outline flex flex-col md:flex-row justify-between items-center gap-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/30">
              © {new Date().getFullYear()} {config?.nom?.toUpperCase() || "TASTIFY"} — ALL RIGHTS RESERVED
          </span>
          <div className="flex gap-8">
             <Link to="/login" className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/30 hover:text-on-background transition-colors">
                Staff Access
             </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

