import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { menuApi } from '../../api/menu';
import type { Categorie, Plat } from '../../api/menu';
import { useCartStore } from '../../store/cartStore';
import {
  Search,
  X,
  Timer,
  ShoppingBag,
  Loader2
} from 'lucide-react';

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
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
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
    <div className="flex-1 flex flex-col items-center justify-center bg-[#FAF9F6] relative overflow-hidden">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6 relative z-10"
        >
            <Loader2 className="w-12 h-12 animate-spin text-[#D14D1A]" strokeWidth={1.5}/>
            <span className="font-sans text-[9px] font-black text-[#2D2424]/40 uppercase tracking-[0.4em]">Chargement de la carte</span>
        </motion.div>
        <div className="absolute inset-0 bg-[#C5A059]/5 blur-[100px] rounded-full" />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-background font-body selection:bg-primary/20">
      
      {/* Search & Header */}
      <div className="flex-none px-client-margin py-unit-lg border-b border-outline-variant bg-surface-main">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div>
              <h1 className="font-serif text-3xl md:text-5xl font-black text-on-surface tracking-tighter uppercase italic">Notre Carte</h1>
              <p className="font-body text-sm text-on-surface-variant mt-2 uppercase tracking-widest opacity-60">Découvrez nos créations culinaires</p>
           </div>
           <div className="relative group w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <label htmlFor="menu-search-input" className="sr-only">Rechercher</label>
              <input 
                id="menu-search-input"
                type="text"
                aria-label="Rechercher"
                placeholder="RECHERCHER UN PLAT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 bg-surface-container border border-outline-variant rounded-xl pl-12 pr-4 font-sans text-xs font-bold text-on-surface focus:border-primary outline-none transition-all uppercase placeholder:text-on-surface-variant/30"
              />
           </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex-none bg-surface-container-low border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-client-margin py-4 flex gap-3 overflow-x-auto no-scrollbar relative">
           <button
             onClick={() => setActiveCat(null)}
             className={`px-6 py-2.5 rounded-full border font-sans text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all relative z-10 ${activeCat === null ? 'text-on-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'}`}
           >
             {activeCat === null && (
                <motion.div 
                    layoutId="active-cat-bg"
                    className="absolute inset-0 bg-primary rounded-full -z-10 shadow-lg shadow-primary/20"
                />
             )}
             Tous les plats
           </button>
           {categories.map(cat => (
             <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`px-6 py-2.5 rounded-full border font-sans text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all relative z-10 ${activeCat === cat.id ? 'text-on-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'}`}
             >
                {activeCat === cat.id && (
                    <motion.div 
                        layoutId="active-cat-bg"
                        className="absolute inset-0 bg-primary rounded-full -z-10 shadow-lg shadow-primary/20"
                    />
                )}
                {cat.nom}
             </button>
           ))}
        </div>
      </div>

      {/* Grid Canvas */}
      <main className="flex-1 overflow-y-auto p-client-margin bg-background custom-scrollbar">
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-24"
        >
           <AnimatePresence mode="popLayout">
              {filteredPlats.map((plat) => (
                <motion.div 
                  key={plat.id}
                  layout
                  variants={itemVariants}
                  data-testid={`menu-card-${plat.id}`}
                  className={`group flex flex-col bg-surface-container-low rounded-3xl border transition-all duration-700 overflow-hidden cursor-pointer ${!plat.est_disponible ? 'opacity-40 grayscale border-outline-variant/30' : 'border-outline-variant hover:border-primary/40 hover:bg-surface-bright shadow-sm hover:shadow-2xl'}`}
                  onClick={() => plat.est_disponible && setSelectedPlat(plat)}
                  whileHover={{ y: -8 }}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-surface-container-highest">
                    {plat.image ? (
                       <img src={plat.image} data-testid={`menu-card-image-${plat.id}`} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" alt={plat.nom} />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center font-serif italic text-6xl text-on-surface-variant/10">{plat.nom.charAt(0)}</div>
                    )}
                    
                    <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                       <div className="bg-background/80 backdrop-blur-md border border-outline-variant/30 px-3 py-1 rounded-lg flex items-center gap-2">
                          <Timer className="w-3.5 h-3.5 text-primary" />
                          <span className="font-sans text-[11px] font-black text-on-surface tabular-nums">{plat.temps_preparation} min</span>
                       </div>
                       {!plat.est_disponible && (
                          <span className="bg-error text-on-error px-3 py-1 rounded font-sans text-[9px] font-black uppercase tracking-widest">Épuisé</span>
                       )}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1 gap-3">
                    <div className="flex justify-between items-baseline gap-2">
                      <h3 className="font-serif text-lg font-black text-primary uppercase tracking-tighter leading-[1.1] flex-1">{plat.nom}</h3>
                      <div className="flex items-baseline gap-1 whitespace-nowrap shrink-0">
                        <span className="font-sans text-2xl font-black text-primary tabular-nums">{parseFloat(plat.prix).toFixed(0)}</span>
                        <span className="font-sans text-[11px] font-black text-primary uppercase tracking-widest">DH</span>
                      </div>
                    </div>
                    <p className="font-body text-sm text-on-surface-variant line-clamp-3 italic opacity-70 leading-relaxed flex-1">{plat.description || 'Une création culinaire d\'exception.'}</p>
                    {plat.est_disponible && (
                      <button
                        onClick={(e) => { e.stopPropagation(); addItem(plat); }}
                        aria-label={`Ajouter ${plat.nom} au panier`}
                        className="mt-2 w-full h-10 rounded-xl bg-primary text-on-primary font-sans text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
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
           <div className="py-32 flex flex-col items-center justify-center text-on-surface-variant/10 gap-4">
              <ShoppingBag className="w-16 h-16 stroke-[0.5]" />
              <p className="font-sans text-[11px] font-black uppercase tracking-[0.5em]">Aucun résultat trouvé</p>
           </div>
        )}
      </main>

      {/* Detailed Modal Overlay */}
      <AnimatePresence>
        {selectedPlat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-background/95 backdrop-blur-xl"
               onClick={() => setSelectedPlat(null)}
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-4xl bg-surface-container border border-outline-variant rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
             >
                <button aria-label="Fermer le détail du plat" onClick={() => setSelectedPlat(null)} className="absolute top-6 right-6 z-20 p-2 rounded-full bg-background/50 border border-outline-variant/30 text-on-surface hover:bg-background transition-colors"><X className="w-5 h-5" /></button>
                
                <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-surface-container-highest relative">
                   {selectedPlat.image ? (
                      <img src={selectedPlat.image} data-testid={`menu-detail-image-${selectedPlat.id}`} className="absolute inset-0 w-full h-full object-cover" alt={selectedPlat.nom} />
                   ) : (
                      <div className="absolute inset-0 flex items-center justify-center font-serif italic text-8xl text-on-surface-variant/10">{selectedPlat.nom.charAt(0)}</div>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                </div>

                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
                   <div className="mb-8">
                      <span className="editorial-kicker mb-3">DÉTAILS DU PLAT</span>
                      <h2 className="font-serif text-3xl md:text-5xl font-black text-primary uppercase italic tracking-tighter leading-none mb-4">{selectedPlat.nom}</h2>
                      <div className="flex items-baseline gap-4">
                         <span className="font-sans text-4xl font-black text-on-surface tabular-nums">{selectedPlat.prix} DH</span>
                      </div>
                   </div>

                   <p className="font-body text-lg md:text-xl text-on-surface-variant italic leading-relaxed mb-10 flex-1 uppercase tracking-tight">
                     {selectedPlat.description || 'Une création signature préparée avec soin par nos chefs.'}
                   </p>

                   <div className="space-y-8 pt-8 border-t border-outline-variant">
                      <div className="flex items-center gap-8">
                         <div className="space-y-1">
                            <p className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Préparation</p>
                            <div className="flex items-center gap-2 font-sans font-bold text-on-surface uppercase text-sm">
                               <Timer className="w-4 h-4 text-primary" />
                               {selectedPlat.temps_preparation} min
                            </div>
                         </div>
                         <div className="space-y-1">
                            <p className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Catégorie</p>
                            <div className="font-sans font-bold text-on-surface uppercase text-sm">
                               {categories.find(c => c.id === selectedPlat.categorie)?.nom || 'Plat'}
                            </div>
                         </div>
                      </div>
                   </div>
                   <motion.button
                     onClick={() => { addItem(selectedPlat); setSelectedPlat(null); }}
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     className="mt-6 w-full h-14 rounded-xl bg-primary text-on-primary font-sans text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                   >
                     <ShoppingBag className="w-4 h-4" />
                     Ajouter au panier
                   </motion.button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
