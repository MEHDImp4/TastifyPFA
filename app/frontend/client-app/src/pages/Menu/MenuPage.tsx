import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Search, ShoppingBag, Timer, X } from 'lucide-react';
import { menuApi } from '../../api/menu';
import type { Categorie, Plat } from '../../api/menu';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useConfigStore } from '../../store/configStore';
import { useCartStore } from '../../store/cartStore';

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
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const activeCategory = categories.find((cat) => cat.id === activeCat) ?? null;
  const categoryLabel = activeCategory?.nom ?? 'Tous les plats';
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
      <div className="flex-none border-b border-outline bg-surface">
        <section className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-client-margin py-10 sm:py-12 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,420px)] lg:items-end lg:gap-12">
          <div className="relative overflow-hidden rounded-[28px] border border-outline bg-[linear-gradient(135deg,rgba(255,253,251,1)_0%,rgba(251,245,237,1)_52%,rgba(246,235,224,1)_100%)] px-6 py-8 shadow-[0_20px_60px_rgba(69,10,10,0.05)] sm:px-8 sm:py-9">
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(180,83,9,0.16),transparent_48%)]" />
            <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,rgba(69,10,10,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(69,10,10,0.18)_1px,transparent_1px)] [background-size:36px_36px]" />
            <div className="relative space-y-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-ui-label text-on-surface-variant">Menu</span>
                <span className="rounded-full border border-outline bg-white/80 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.22em] text-on-surface-variant shadow-sm">
                  {totalCount} plats
                </span>
              </div>
              <div className="max-w-2xl space-y-4">
                <h1 className="text-display-lg lowercase">la carte.</h1>
                <p className="max-w-xl text-sm text-on-surface-variant sm:text-base">
                  Une lecture plus claire, des assiettes mises en valeur et une navigation plus douce pour parcourir la carte du restaurant.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-outline bg-surface-container-high/80 p-2 shadow-[0_16px_50px_rgba(69,10,10,0.04)]">
              <div className="flex items-center gap-3 rounded-[18px] bg-background px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-outline bg-surface-container-high text-on-surface-variant">
                  <Search className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="mb-1 block text-[0.62rem] font-bold uppercase tracking-[0.22em] text-on-surface-subtle">
                    Recherche
                  </span>
                  <input
                    type="text"
                    aria-label="Rechercher"
                    placeholder="Rechercher un plat"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full border-none bg-transparent p-0 text-sm font-semibold text-on-background placeholder:text-on-surface-subtle focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 px-1">
              <div className="min-w-0">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-on-surface-subtle">Catégorie active</p>
                <p className="truncate text-sm font-semibold text-on-background">{categoryLabel}</p>
              </div>
              {search.trim() ? (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline bg-background px-4 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant transition-colors hover:text-on-background"
                >
                  <X className="h-3.5 w-3.5" />
                  Effacer
                </button>
              ) : (
                <p className="text-right text-xs text-on-surface-subtle">Navigation fluide et filtrage instantané.</p>
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
            <h2 className="text-2xl sm:text-3xl">Une carte plus lisible, pensée plat par plat.</h2>
          </div>
          <p className="max-w-md text-sm text-on-surface-variant">
            Des cartes plus légères, des visuels mieux tenus et une lecture rapide du nom, du prix et de la description.
          </p>
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
              return (
                <motion.article
                  key={plat.id}
                  layout
                  variants={itemVariants}
                  data-testid={`menu-card-${plat.id}`}
                  className={`menu-card group ${!plat.est_disponible ? 'opacity-75' : ''}`}
                >
                  <div className="relative">
                    {plat.est_disponible ? (
                      <button
                        type="button"
                        aria-label={`Voir le détail de ${plat.nom}`}
                        onClick={() => setSelectedPlat(plat)}
                        className="block w-full text-left focus-visible:outline-none"
                      >
                        <DishVisual
                          plat={plat}
                          className="relative aspect-[4/3] overflow-hidden rounded-[22px] border border-outline bg-surface-container-high shadow-[0_16px_38px_rgba(69,10,10,0.05)]"
                          imageClassName="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      </button>
                    ) : (
                      <div className="relative">
                        <DishVisual
                          plat={plat}
                          className="relative aspect-[4/3] overflow-hidden rounded-[22px] border border-outline bg-surface-container-high shadow-[0_16px_38px_rgba(69,10,10,0.05)]"
                          imageClassName="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 rounded-[22px] bg-background/45 backdrop-blur-[2px]" />
                      </div>
                    )}

                    <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
                      <span className="rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-on-surface shadow-sm backdrop-blur-sm">
                        {categoryName}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] shadow-sm ${
                        plat.est_disponible
                          ? 'border border-white/70 bg-white/85 text-on-surface backdrop-blur-sm'
                          : 'border border-outline bg-background/90 text-on-surface-variant'
                      }`}>
                        {plat.est_disponible ? 'Disponible' : 'Épuisé'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-5 px-1">
                    <div className="flex items-start justify-between gap-4 border-b border-outline pb-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[1.7rem] leading-[1.02]">{plat.nom}</h3>
                      </div>
                      <div className="shrink-0 rounded-full border border-outline bg-surface-container-high px-3 py-2 text-right shadow-sm">
                        <span className="block font-mono text-[0.72rem] uppercase tracking-[0.18em] text-on-surface-subtle">
                          {config?.devise || 'DH'}
                        </span>
                        <span className="block text-lg font-semibold leading-none text-on-background">
                          {parseFloat(plat.prix).toFixed(0)}
                        </span>
                      </div>
                    </div>

                    <p className="flex-1 text-sm leading-7 text-on-surface-variant">
                      {plat.description || 'Plat préparé par la cuisine avec une présentation sobre et raffinée.'}
                    </p>

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedPlat(plat)}
                        className="inline-flex min-h-11 items-center border-b border-outline pb-0.5 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-on-surface-variant transition-colors hover:text-on-background"
                      >
                        Voir détails
                      </button>

                      {plat.est_disponible ? (
                        <button
                          aria-label={`Ajouter ${plat.nom} au panier`}
                          onClick={(e) => {
                            e.stopPropagation();
                            addItem(plat);
                          }}
                          className="menu-add-button"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          Ajouter
                        </button>
                      ) : (
                        <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-on-surface-subtle">
                          Indisponible
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
                  <span className="mb-4 block text-[0.62rem] font-bold uppercase tracking-[0.24em] text-on-surface-subtle">
                    Détails du plat
                  </span>
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
