import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
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
    <div className="page-shell text-on-background">
      
      {/* Simple Minimal Hero */}
      <section className="relative w-full flex flex-col justify-center border-b border-outline">
        <div className="max-w-[1200px] mx-auto w-full px-client-margin py-12 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 items-center">
          <motion.div
             initial={{ y: 10 }}
             animate={{ y: 0 }}
             transition={{ duration: 0.6 }}
             className="lg:col-span-7 space-y-8"
          >
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-background">Gastronomie Contemporaine</span>
            </div>

            <h1 className="text-[clamp(3rem,12vw,5.75rem)] font-bold tracking-tight leading-[0.95]">
              {config?.nom ? config.nom : "Tastify"} <br/>
              <span className="text-on-background">Cuisine de terroir.</span>
            </h1>

            <div className="max-w-lg">
                <p className="text-lg text-on-background leading-relaxed">
                   Une table marocaine contemporaine où chaque plat raconte une histoire de terroir et d'élégance simple.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2 sm:pt-4">
                <Link to="/menu" className="btn-primary min-h-14">
                Voir la Carte
                </Link>
                <Link to="/reservations" className="btn-secondary min-h-14">
                Réserver une table
                </Link>
            </div>
          </motion.div>

          <div className="lg:col-span-5 block">
            <div className="aspect-[16/11] sm:aspect-[4/5] max-h-[420px] lg:max-h-none bg-surface-container-high rounded-lg overflow-hidden border border-outline">
                <img 
                    src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200"
                    alt="Table dressée dans une ambiance restaurant contemporaine"
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-full object-cover opacity-90"
                />
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Selection - Clean Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-client-margin">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 md:mb-16 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-on-surface-variant">
                 <Sparkles className="w-4 h-4" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Inspirations</span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight">Sélection du Chef</h3>
            </div>
            <Link to="/menu" className="min-h-11 inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-on-background border-b border-outline hover:border-on-background transition-all">
                Tout voir
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {isLoading ? [1, 2].map(i => (
               <div key={i} className="aspect-video bg-surface-container-high animate-pulse rounded-lg border border-outline" />
            )) : topDishes.length === 0 ? (
              <div className="col-span-full py-16 text-center opacity-40">
                <p className="text-sm font-bold uppercase tracking-widest">Sélection indisponible pour le moment</p>
              </div>
            ) : topDishes.map((dish, idx) => (
              <motion.div 
                key={dish.id}
                initial={{ opacity: 0, y: 5 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="atelier-card p-6 flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-8">
                    <span className="font-mono text-xs opacity-20">0{idx + 1}</span>
                    <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full border border-outline">
                        <TrendingUp className="w-3 h-3 text-success" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Tendance</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
                    <div className="lg:col-span-5">
                        <div className="aspect-square rounded-md overflow-hidden border border-outline">
                            {dish.image ? (
                                <img src={dish.image} className="w-full h-full object-cover" alt={dish.nom} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-surface-container-high text-on-surface-variant/20 font-bold text-4xl">{dish.nom.charAt(0)}</div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-7 space-y-4">
                        <div>
                            <h4 className="text-lg font-bold tracking-tight">{dish.nom}</h4>
                            <p className="font-mono text-xs text-on-surface-variant">{config?.devise || 'DH'} {parseFloat(dish.prix).toFixed(0)}</p>
                        </div>

                        <div className="space-y-3">
                            {dish.top_avis && dish.top_avis.length > 0 && (
                                <div className="pl-4 border-l border-outline">
                                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                                        "{dish.top_avis[0].commentaire}"
                                    </p>
                                </div>
                            )}
                        </div>

                        <Link
                            to="/menu"
                            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-background transition-colors"
                        >
                            Détails <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-20 px-client-margin border-t border-outline">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-6 space-y-6">
                <Link to="/" className="inline-block">
                    <h2 className="text-2xl font-bold tracking-tighter">
                        {config?.nom || "tastify."}
                    </h2>
                </Link>
                <p className="text-sm text-on-surface-variant leading-relaxed max-w-sm">
                   Une hospitalité contemporaine, servie avec précision et simplicité au coeur de la ville.
                </p>
          </div>

          <div className="md:col-span-3 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Menu</span>
            <ul className="space-y-2">
              <li><Link to="/menu" className="text-xs text-on-surface-variant hover:text-on-background transition-colors">La Carte</Link></li>
              <li><Link to="/reservations" className="text-xs text-on-surface-variant hover:text-on-background transition-colors">Réservations</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-4 md:text-right">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Contact</span>
            <div className="space-y-2">
                <p className="text-xs text-on-surface-variant">
                  {config?.adresse || "Casablanca"}
                </p>
                {config?.telephone && <p className="text-sm font-mono">{config.telephone}</p>}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
