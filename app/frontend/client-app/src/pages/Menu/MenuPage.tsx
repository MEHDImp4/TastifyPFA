import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { menuApi } from '../../api/menu';
import type { Categorie, Plat } from '../../api/menu';
import { useCartStore } from '../../store/cartStore';
import { useConfigStore } from '../../store/configStore';
import {
  Search,
  X,
  Timer,
  ShoppingBag,
  Loader2
} from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.23, 1, 0.32, 1] as any
    }
  }
};

export const MenuPage: React.FC = () => {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlat, setSelectedPlat] = useState<Plat | null>(null);
  const { addItem } = useCartStore();
  const { config } = useConfigStore();
  useBodyScrollLock(Boolean(selectedPlat));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, platsRes] = await Promise.all([
          menuApi.getCategories(),
          menuApi.getPlats()
        ]);
        const sortedCats = catsRes.data.sort((a, b) => a.ordre_affichage - b.ordre_affichage);
        setCategories(sortedCats);
        setPlats(platsRes.data);
        if (sortedCats.length > 0) setActiveCat(sortedCats[0].id);
      } catch (err) {
        console.error('Failed to load menu', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPlats = plats.filter(p => 
    (activeCat === null || p.categorie === activeCat) &&
    (search === '' || p.nom.toLowerCase().includes(search.toLowerCase()) || (p.description && p.description.toLowerCase().includes(search.toLowerCase())))
  );

  if (isLoading) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
        >
            <Loader2 className="w-8 h-8 animate-spin text-on-background" strokeWidth={1}/>
            <span className="text-ui-label text-on-surface-variant">Chargement de la carte</span>
        </motion.div>
    </div>
  );

  return (
    <div className="page-shell flex flex-col">
      
      {/* Header */}
      <div className="flex-none px-client-margin py-12 md:py-20 border-b border-outline bg-surface">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-12">
           <div className="space-y-4">
              <span className="text-ui-label text-on-surface-variant">L'Atelier</span>
              <h1 className="text-display-lg  lowercase">notre carte.</h1>
           </div>
           <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-on-background transition-colors" />
              <input
                type="text"
                aria-label="Rechercher"
                placeholder="RECHERCHER UN PLAT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 bg-background border border-outline rounded-md pl-12 pr-4 font-sans text-xs text-on-background focus:border-on-background outline-none transition-all placeholder:text-on-surface-variant/30 uppercase"
              />
           </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex-none bg-surface border-b border-outline">
        <div className="max-w-[1200px] mx-auto px-client-margin py-4 md:py-6 flex gap-4 md:gap-8 overflow-x-auto no-scrollbar relative">
           <button
             onClick={() => setActiveCat(null)}
             className={`text-ui-label text-[10px] whitespace-nowrap transition-all relative ${activeCat === null ? 'text-on-background font-bold' : 'text-on-surface-variant hover:text-on-background'}`}
           >
             Tous les plats
             {activeCat === null && (
                <motion.div layoutId="active-cat-indicator" className="absolute -bottom-6 left-0 right-0 h-[2px] bg-on-background" />
             )}
           </button>
           {categories.map(cat => (
             <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`text-ui-label text-[10px] whitespace-nowrap transition-all relative ${activeCat === cat.id ? 'text-on-background font-bold' : 'text-on-surface-variant hover:text-on-background'}`}
             >
                {cat.nom}
                {activeCat === cat.id && (
                    <motion.div layoutId="active-cat-indicator" className="absolute -bottom-6 left-0 right-0 h-[2px] bg-on-background" />
                )}
             </button>
           ))}
        </div>
      </div>

      {/* Grid Canvas */}
      <main className="flex-1 py-12 md:py-24 px-client-margin bg-background">
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pb-24"
        >
           <AnimatePresence mode="popLayout">
              {filteredPlats.map((plat) => (
                <motion.div 
                  key={plat.id}
                  layout
                  variants={itemVariants}
                  data-testid={`menu-card-${plat.id}`}
                  className={`group atelier-card p-6 flex flex-col gap-6 cursor-pointer ${!plat.est_disponible ? 'opacity-30 grayscale' : ''}`}
                  onClick={() => plat.est_disponible && setSelectedPlat(plat)}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-outline grayscale group-hover:grayscale-0 transition-all duration-700">
                    {plat.image ? (
                       <img src={plat.image} className="w-full h-full object-cover" alt={plat.nom} loading="lazy" decoding="async" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center bg-surface-container-high text-on-surface-variant/10   text-4xl">{plat.nom.charAt(0)}</div>
                    )}
                    
                    {!plat.est_disponible && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Épuisé</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 gap-4">
                    <div className="flex justify-between items-baseline gap-4">
                      <h3 className="text-xl font-medium tracking-tight flex-1">{plat.nom}</h3>
                      <span className="font-mono text-xs text-on-surface-variant whitespace-nowrap">{parseFloat(plat.prix).toFixed(0)} {config?.devise || 'DH'}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed flex-1 ">{plat.description || 'Une création culinaire d\'exception.'}</p>
                    
                    {plat.est_disponible && (
                      <button
                        aria-label={`Ajouter ${plat.nom} au panier`}
                        onClick={(e) => { e.stopPropagation(); addItem(plat); }}
                        className="btn-primary w-full h-10 text-[10px]"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Ajouter au panier
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
           </AnimatePresence>
        </motion.div>

        {filteredPlats.length === 0 && (
           <div className="py-32 flex flex-col items-center justify-center opacity-10 gap-4">
              <ShoppingBag className="w-12 h-12 stroke-[1]" />
              <p className="text-ui-label">AUCUN RÉSULTAT TROUVÉ</p>
           </div>
        )}
      </main>

      {/* Detailed Modal */}
      <AnimatePresence>
        {selectedPlat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-background/80 backdrop-blur-xl"
               onClick={() => setSelectedPlat(null)}
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.98 }}
               className="relative w-full max-w-4xl max-h-[calc(100dvh-2rem)] bg-surface border border-outline rounded-lg overflow-hidden shadow-2xl flex flex-col md:flex-row"
             >
                <button aria-label="Fermer le détail du plat" onClick={() => setSelectedPlat(null)} className="absolute top-6 right-6 z-20 p-2 text-on-surface-variant hover:text-on-background transition-colors"><X className="w-5 h-5" strokeWidth={1.5} /></button>
                
                <div className="w-full md:w-1/2 aspect-[4/3] md:aspect-auto bg-surface-container-high relative border-b md:border-b-0 md:border-r border-outline shrink-0">
                   {selectedPlat.image ? (
                      <img src={selectedPlat.image} className="absolute inset-0 w-full h-full object-cover grayscale" alt={selectedPlat.nom} loading="lazy" decoding="async" />
                   ) : (
                      <div className="absolute inset-0 flex items-center justify-center   text-8xl text-on-surface-variant/10">{selectedPlat.nom.charAt(0)}</div>
                   )}
                </div>

                <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto custom-scrollbar">
                   <div className="mb-8">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4 block">DÉTAILS DU PLAT</span>
                      <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-6 break-words">{selectedPlat.nom}</h2>
                      <span className="font-mono text-xl text-on-background">{selectedPlat.prix} {config?.devise || 'DH'}</span>
                   </div>

                   <p className="text-base text-on-surface-variant leading-relaxed mb-10">
                     {selectedPlat.description || 'Une création signature préparée avec soin par nos chefs.'}
                   </p>

                   <div className="space-y-8 pt-8 border-t border-outline mt-auto">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12">
                         <div className="space-y-1">
                            <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Préparation</p>
                            <div className="flex items-center gap-2 font-mono text-sm text-on-surface">
                               <Timer className="w-3.5 h-3.5" strokeWidth={1.5} />
                               {selectedPlat.temps_preparation}m
                            </div>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Catégorie</p>
                            <div className="text-[11px] font-bold text-on-surface uppercase tracking-wider">
                               {categories.find(c => c.id === selectedPlat.categorie)?.nom || 'Plat'}
                            </div>
                         </div>
                      </div>
                      <button
                        onClick={() => { addItem(selectedPlat); setSelectedPlat(null); }}
                        className="btn-primary w-full h-14"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Ajouter au panier
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


