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

const MENU_PAGE_SIZE = 9;

export const MenuPage: React.FC = () => {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [activeCat, setActiveCat] = useState<number | null | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [isPlatsLoading, setIsPlatsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPlat, setSelectedPlat] = useState<Plat | null>(null);
  const { addItem } = useCartStore();
  const { config } = useConfigStore();
  useBodyScrollLock(Boolean(selectedPlat));

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catsRes = await menuApi.getCategories();
        const sortedCats = catsRes.data.sort((a, b) => a.ordre_affichage - b.ordre_affichage);
        setCategories(sortedCats);
        setActiveCat(sortedCats[0]?.id ?? null);
      } catch (err) {
        console.error('Failed to load menu categories', err);
        setActiveCat(null);
      } finally {
        setIsCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeCat === undefined) return;

    const fetchPlats = async () => {
      const isFirstPage = currentPage === 1;
      setIsPlatsLoading(isFirstPage);
      setIsLoadingMore(!isFirstPage);

      try {
        const res = await menuApi.getPlatsPage({
          page: currentPage,
          page_size: MENU_PAGE_SIZE,
          categorie: activeCat ?? undefined,
          search: search.trim() || undefined,
        });

        setTotalCount(res.data.count);
        setPlats(prev => (
          isFirstPage
            ? res.data.results
            : [...prev, ...res.data.results.filter(item => !prev.some(existing => existing.id === item.id))]
        ));
      } catch (err) {
        console.error('Failed to load menu dishes', err);
        if (isFirstPage) {
          setPlats([]);
          setTotalCount(0);
        }
      } finally {
        setIsPlatsLoading(false);
        setIsLoadingMore(false);
      }
    };

    fetchPlats();
  }, [activeCat, currentPage, search]);

  const handleCategoryChange = (categoryId: number | null) => {
    setActiveCat(categoryId);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const hasMorePlats = plats.length < totalCount;
  const isInitialLoading = isCategoriesLoading || (isPlatsLoading && plats.length === 0);

  if (isInitialLoading) return (
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
      <div className="flex-none px-client-margin page-section border-b border-outline bg-surface">
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
                onChange={(e) => handleSearchChange(e.target.value)}
                className="field-control pl-12 pr-4 text-xs uppercase placeholder:text-on-surface-subtle"
              />
           </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex-none bg-surface border-b border-outline">
        <div className="max-w-[1200px] mx-auto px-client-margin py-4 md:py-6 flex gap-4 md:gap-8 overflow-x-auto no-scrollbar relative">
           <button
             onClick={() => handleCategoryChange(null)}
             className={`min-h-11 px-1 text-ui-label text-[10px] whitespace-nowrap transition-all relative ${activeCat === null ? 'text-on-background font-bold' : 'text-on-surface-variant hover:text-on-background'}`}
           >
             Tous les plats
             {activeCat === null && (
                <motion.div layoutId="active-cat-indicator" className="absolute -bottom-6 left-0 right-0 h-[2px] bg-on-background" />
             )}
           </button>
           {categories.map(cat => (
             <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`min-h-11 px-1 text-ui-label text-[10px] whitespace-nowrap transition-all relative ${activeCat === cat.id ? 'text-on-background font-bold' : 'text-on-surface-variant hover:text-on-background'}`}
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
      <main className="flex-1 page-section px-client-margin bg-background">
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-12 pb-24"
        >
           <AnimatePresence mode="popLayout">
              {plats.map((plat) => (
                <motion.div 
                  key={plat.id}
                  layout
                  variants={itemVariants}
                  data-testid={`menu-card-${plat.id}`}
                  className={`group atelier-card p-5 sm:p-6 flex flex-col gap-5 sm:gap-6 ${!plat.est_disponible ? 'opacity-60 grayscale' : ''}`}
                >
                  {plat.est_disponible ? (
                    <button
                      type="button"
                      aria-label={`Voir le détail de ${plat.nom}`}
                      onClick={() => setSelectedPlat(plat)}
                      className="relative aspect-video w-full rounded-lg overflow-hidden border border-outline grayscale group-hover:grayscale-0 transition-all duration-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-background focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {plat.image ? (
                         <img src={plat.image} className="w-full h-full object-cover" alt={plat.nom} loading="lazy" decoding="async" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center bg-surface-container-high text-on-surface-variant/10 text-4xl">{plat.nom.charAt(0)}</div>
                      )}
                    </button>
                  ) : (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-outline grayscale transition-all duration-700">
                      {plat.image ? (
                         <img src={plat.image} className="w-full h-full object-cover" alt={plat.nom} loading="lazy" decoding="async" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center bg-surface-container-high text-on-surface-variant/10 text-4xl">{plat.nom.charAt(0)}</div>
                      )}
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Épuisé</span>
                      </div>
                    </div>
                  )}

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
                        className="btn-primary w-full min-h-[48px]"
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

        {isPlatsLoading && currentPage === 1 && plats.length > 0 && (
           <div className="py-12 flex items-center justify-center text-on-surface-variant">
              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
           </div>
        )}

        {plats.length === 0 && !isPlatsLoading && (
           <div className="py-24 sm:py-32 flex flex-col items-center justify-center text-on-surface-variant gap-4">
              <ShoppingBag className="w-12 h-12 stroke-[1]" />
              <p className="text-ui-label">AUCUN RÉSULTAT TROUVÉ</p>
           </div>
        )}

        {hasMorePlats && (
          <div className="max-w-[1200px] mx-auto flex justify-center pb-20">
            <button
              type="button"
              onClick={() => setCurrentPage(page => page + 1)}
              disabled={isLoadingMore}
              className="btn-secondary min-h-12 px-8"
            >
              {isLoadingMore ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )}
              <span>{isLoadingMore ? 'Chargement' : 'Afficher plus'}</span>
            </button>
          </div>
        )}
      </main>

      {/* Detailed Modal */}
      <AnimatePresence>
        {selectedPlat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`Détails de ${selectedPlat.nom}`}>
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-background/80 backdrop-blur-xl"
               onClick={() => setSelectedPlat(null)}
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.98 }}
               className="relative w-full max-w-4xl max-h-[calc(100dvh-1.5rem)] bg-surface border border-outline rounded-lg overflow-hidden shadow-2xl flex flex-col md:flex-row"
             >
                <button aria-label="Fermer le détail du plat" onClick={() => setSelectedPlat(null)} className="btn-icon absolute top-4 right-4 md:top-6 md:right-6 z-20 bg-surface/90"><X className="w-5 h-5" strokeWidth={1.5} /></button>
                
                <div className="w-full md:w-1/2 aspect-[4/3] md:aspect-auto bg-surface-container-high relative border-b md:border-b-0 md:border-r border-outline shrink-0">
                   {selectedPlat.image ? (
                      <img src={selectedPlat.image} className="absolute inset-0 w-full h-full object-cover grayscale" alt={selectedPlat.nom} loading="lazy" decoding="async" />
                   ) : (
                      <div className="absolute inset-0 flex items-center justify-center   text-8xl text-on-surface-variant/10">{selectedPlat.nom.charAt(0)}</div>
                   )}
                </div>

                <div className="w-full md:w-1/2 p-5 sm:p-6 md:p-10 flex flex-col overflow-y-auto custom-scrollbar">
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
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Préparation</p>
                            <div className="flex items-center gap-2 font-mono text-sm text-on-surface">
                               <Timer className="w-3.5 h-3.5" strokeWidth={1.5} />
                               {selectedPlat.temps_preparation}m
                            </div>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Catégorie</p>
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


