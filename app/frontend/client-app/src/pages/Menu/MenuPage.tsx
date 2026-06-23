import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Search, ShoppingBag, Timer, X, TrendingUp } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { menuApi } from '../../api/menu';
import type { Categorie, Plat } from '../../api/menu';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useConfigStore } from '../../store/configStore';
import { useCartStore } from '../../store/cartStore';
import { toast } from 'sonner';

export const getPlatReviewSummary = (plat: Plat) => {
  return { count: plat.top_avis?.length ?? 0 };
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.23, 1, 0.32, 1] as any
    }
  }
};

const MENU_PAGE_SIZE = 9;

const getFallbackTone = (value: string) => {
  const tones = [
    'from-[#FBF4EC] via-[#FFFDF9] to-[#F3E3D0]',
    'from-[#F8EFE8] via-[#FFFDFC] to-[#EEDDD0]',
    'from-[#FAF6F0] via-[#FFFDFB] to-[#F1E4D8]',
  ];

  const sum = Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return tones[sum % tones.length];
};

const DishVisual = ({
  plat,
  className,
  imageClassName,
}: {
  plat: Plat;
  className: string;
  imageClassName: string;
}) => {
  const [hasError, setHasError] = useState(false);
  const showImage = Boolean(plat.image) && !hasError;

  useEffect(() => {
    setHasError(false);
  }, [plat.image, plat.nom]);

  return (
    <div className={className}>
      {showImage ? (
        <img
          src={plat.image ?? undefined}
          className={imageClassName}
          alt={plat.nom}
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${getFallbackTone(plat.nom)}`}>
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(69,10,10,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(69,10,10,0.18)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(180,83,9,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(69,10,10,0.12),transparent_32%)]" />
          <div className="absolute inset-x-5 top-5 flex items-center justify-between text-[0.6rem] font-bold uppercase tracking-[0.28em] text-on-surface-muted/80">
            <span>Tastify</span>
            <span>Signature</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/70 bg-white/70 shadow-[0_18px_50px_rgba(69,10,10,0.10)] backdrop-blur-sm">
              <span className="font-heading text-5xl leading-none text-on-background">{plat.nom.charAt(0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const MenuPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

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
        
        const initialCat = categoryParam ? parseInt(categoryParam, 10) : null;
        setActiveCat(initialCat);
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
    if (activeCat !== undefined) {
      const currentParam = categoryParam ? parseInt(categoryParam, 10) : null;
      if (currentParam !== activeCat) {
        setActiveCat(currentParam);
        setCurrentPage(1);
      }
    }
  }, [categoryParam]);

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
        setPlats((prev) => (
          isFirstPage
            ? res.data.results
            : [...prev, ...res.data.results.filter((item) => !prev.some((existing) => existing.id === item.id))]
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
    if (categoryId === null) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', String(categoryId));
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const hasMorePlats = plats.length < totalCount;
  const isInitialLoading = isCategoriesLoading || (isPlatsLoading && plats.length === 0);

  if (isInitialLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 animate-spin text-on-background" strokeWidth={1} />
          <span className="text-ui-label text-on-surface-variant">Chargement de la carte</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-shell flex flex-col">
      <div className="flex-none border-b border-outline/40 bg-surface">
        <section className="mx-auto w-full max-w-[1200px] px-client-margin py-6">
          <div className="flex justify-center w-full">
            <div className="w-full max-w-md space-y-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-accent/60" />
                <input
                  type="text"
                  aria-label="Rechercher"
                  placeholder="Épices, entrées, tajines..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-outline bg-background text-sm font-semibold text-on-background placeholder:text-on-surface-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-premium"
                />
              </div>
              
              {search.trim() && (
                <div className="flex justify-end text-[9px] tracking-wider uppercase font-bold text-on-surface-subtle px-1">
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-primary hover:text-accent transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Effacer
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="flex-none border-b border-outline bg-background/95">
        <div className="mx-auto flex max-w-[1200px] gap-3 overflow-x-auto px-client-margin py-5 no-scrollbar">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`menu-filter-chip ${activeCat === null ? 'menu-filter-chip-active' : 'menu-filter-chip-idle'}`}
          >
            Tous les plats
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`menu-filter-chip ${activeCat === cat.id ? 'menu-filter-chip-active' : 'menu-filter-chip-idle'}`}
            >
              {cat.nom}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 bg-background px-client-margin py-8 sm:py-10 lg:py-12">
        <div className="mx-auto mb-8 flex max-w-[1200px] flex-col gap-4 border-b border-outline pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-on-surface-subtle">Sélection</p>
            <h2 className="text-2xl sm:text-3xl">Notre sélection de plats et spécialités.</h2>
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-7"
        >
          <AnimatePresence mode="popLayout">
            {plats.map((plat) => {
              const categoryName = categories.find((cat) => cat.id === plat.categorie)?.nom || 'Plat';
              const { count } = getPlatReviewSummary(plat);
              return (
                <motion.article
                  key={plat.id}
                  layout
                  variants={itemVariants}
                  data-testid={`menu-card-${plat.id}`}
                  className={`menu-card flex-row gap-5 sm:gap-6 items-center group ${!plat.est_disponible ? 'opacity-75' : ''}`}
                >
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 self-center">
                    {plat.est_disponible ? (
                      <button
                        type="button"
                        aria-label={`Voir le détail de ${plat.nom}`}
                        onClick={() => setSelectedPlat(plat)}
                        className="block w-full h-full text-left focus-visible:outline-none"
                      >
                        <DishVisual
                          plat={plat}
                          className="relative w-full h-full overflow-hidden rounded-2xl border border-outline bg-surface-container-high shadow-sm"
                          imageClassName="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                        />
                      </button>
                    ) : (
                      <div className="relative w-full h-full">
                        <DishVisual
                          plat={plat}
                          className="relative w-full h-full overflow-hidden rounded-2xl border border-outline bg-surface-container-high shadow-sm"
                          imageClassName="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 rounded-2xl bg-background/45 backdrop-blur-[1px]" />
                      </div>
                    )}

                    <div className="absolute left-3 top-3 z-10 flex items-start gap-1">
                      <span className="rounded-full border border-white/40 bg-white/95 px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-widest text-[#3B0909] shadow-md backdrop-blur-md">
                        {categoryName}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1 gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                        <h3 
                          onClick={() => plat.est_disponible && setSelectedPlat(plat)}
                          className={`text-base sm:text-lg font-bold text-on-background leading-tight ${plat.est_disponible ? 'cursor-pointer hover:text-primary transition-colors' : ''} font-heading tracking-wide uppercase`}
                        >
                          {plat.nom}
                        </h3>
                        <span className="text-sm sm:text-base font-bold text-accent shrink-0 font-mono">
                          {parseFloat(plat.prix).toFixed(0)} <span className="text-xs font-semibold">{config?.devise || 'DH'}</span>
                        </span>
                      </div>
                      
                      <p className="text-[11px] sm:text-xs text-on-surface-muted line-clamp-2 leading-relaxed italic">
                        {plat.description || 'Plat préparé par la cuisine avec une présentation sobre et raffinée.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 mt-auto border-t border-dashed border-outline-variant/60">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="rounded-md bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-subtle">
                          {count} avis
                        </span>
                        {plat.sentiment_score !== null && plat.sentiment_score > 0.3 && (
                          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-700">
                            Populaire
                          </span>
                        )}
                      </div>

                      {plat.est_disponible ? (
                        <button
                          type="button"
                          aria-label={`Ajouter ${plat.nom} au panier`}
                          onClick={(e) => {
                            e.stopPropagation();
                            addItem(plat);
                            toast.success(`${plat.nom} ajouté au panier`);
                          }}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-primary bg-primary px-3.5 text-[9px] font-bold uppercase tracking-[0.12em] text-on-primary transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/95 hover:shadow-md active:translate-y-0 active:scale-[0.97]"
                        >
                          <ShoppingBag className="h-3 w-3" />
                          <span>Ajouter</span>
                        </button>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-subtle">
                          Épuisé
                        </span>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {isPlatsLoading && currentPage === 1 && plats.length > 0 && (
          <div className="py-12 flex items-center justify-center text-on-surface-variant">
            <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
          </div>
        )}

        {plats.length === 0 && !isPlatsLoading && (
          <div className="mx-auto mt-8 flex max-w-[1200px] flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-outline bg-surface-container-high/70 px-6 py-24 text-center text-on-surface-variant">
            <ShoppingBag className="h-12 w-12 stroke-[1]" />
            <p className="text-ui-label">Aucun plat trouvé</p>
            <p className="max-w-md text-sm">Essaie une autre recherche ou change de catégorie pour afficher davantage de plats.</p>
          </div>
        )}

        {hasMorePlats && (
          <div className="mx-auto flex max-w-[1200px] justify-center pb-12 pt-12">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={isLoadingMore}
              className="btn-secondary min-h-12 rounded-full px-8"
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

      <AnimatePresence>
        {selectedPlat && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`Détails de ${selectedPlat.nom}`}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-xl"
              onClick={() => setSelectedPlat(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-outline bg-surface shadow-[0_30px_80px_rgba(69,10,10,0.16)] md:flex-row"
            >
              <button
                aria-label="Fermer le détail du plat"
                onClick={() => setSelectedPlat(null)}
                className="btn-icon absolute top-4 right-4 z-20 border-white/70 bg-white/85 backdrop-blur-sm md:top-6 md:right-6"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>

              <div className="relative w-full shrink-0 border-b border-outline bg-surface-container-high md:w-[48%] md:border-r md:border-b-0">
                <DishVisual
                  plat={selectedPlat}
                  className="relative min-h-[280px] h-full md:min-h-[560px]"
                  imageClassName="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4">
                  <div className="rounded-[22px] border border-white/70 bg-white/80 px-4 py-3 shadow-lg backdrop-blur-sm">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-on-surface-subtle">Catégorie</p>
                    <p className="text-sm font-semibold text-on-background">
                      {categories.find((c) => c.id === selectedPlat.categorie)?.nom || 'Plat'}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/70 bg-white/80 px-4 py-3 text-right shadow-lg backdrop-blur-sm">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-on-surface-subtle">Préparation</p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-on-background">
                      <Timer className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {selectedPlat.temps_preparation} min
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col overflow-y-auto p-6 custom-scrollbar sm:p-8 md:w-[52%] md:p-10">
                <div className="mb-8 border-b border-outline pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-on-surface-subtle">
                      Détails du plat
                    </span>
                    {selectedPlat.sentiment_score !== null && selectedPlat.sentiment_score > 0.3 && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-success/10 rounded-full border border-success/30">
                        <TrendingUp className="w-3 h-3 text-success" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-success">Populaire</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <h2 className="max-w-xl text-[2.2rem] leading-[0.98] break-words sm:text-[2.7rem] md:text-[3.15rem]">
                      {selectedPlat.nom}
                    </h2>
                    <div className="shrink-0 rounded-[22px] border border-outline bg-surface-container-high px-4 py-3 shadow-sm">
                      <span className="block font-mono text-[0.72rem] uppercase tracking-[0.2em] text-on-surface-subtle">
                        {config?.devise || 'DH'}
                      </span>
                      <span className="block text-2xl font-semibold leading-none text-on-background">
                        {parseFloat(selectedPlat.prix).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mb-10 max-w-2xl text-[0.98rem] leading-8 text-on-surface-variant">
                  {selectedPlat.description || 'Plat préparé par la cuisine avec une présentation soignée et une identité marocaine assumée.'}
                </p>

                <div className="mt-auto space-y-5 rounded-[24px] border border-outline bg-surface-container-high/70 p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-on-surface-subtle">Prêt à commander</p>
                      <p className="text-sm text-on-surface-variant">Ajoute ce plat au panier en conservant le même langage visuel que la carte.</p>
                    </div>
                    {!selectedPlat.est_disponible && (
                      <span className="rounded-full border border-outline bg-background px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        Indisponible
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      addItem(selectedPlat);
                      toast.success(`${selectedPlat.nom} ajouté au panier`);
                      setSelectedPlat(null);
                    }}
                    disabled={!selectedPlat.est_disponible}
                    className="menu-add-button w-full justify-center py-4 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShoppingBag className="h-4 w-4" />
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
