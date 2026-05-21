import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { menuApi } from '../../api/menu';
import type { Categorie, Plat } from '../../api/menu';
import { useCartStore } from '../../store/cartStore';
import { Search, Clock, Info, Plus, ArrowRight, Sparkles, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { CardSkeleton, Skeleton } from '../../components/ui/Skeleton';
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
    (search === '' || p.nom.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (isLoading) return (
    <div className="flex-1 flex bg-[#fff8f5]">
        <aside className="w-80 border-r border-[#d8c2b6] p-5 space-y-5 hidden xl:block">
            <Skeleton className="w-28 h-7 mb-4" />
            <div className="space-y-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="w-full h-9 rounded-xl" />)}
            </div>
        </aside>
        <main className="flex-1 p-6 space-y-6">
            <div className="flex justify-between items-end gap-4">
                <div className="space-y-3">
                    <Skeleton className="w-52 h-8 rounded-xl" />
                    <Skeleton className="w-96 h-3 rounded-full" />
                </div>
                <Skeleton className="w-72 h-11 rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {[1,2,3,4,5,6,7,8].map(i => <CardSkeleton key={i} />)}
            </div>
        </main>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-background selection:bg-primary/10 selection:text-primary">
      
      {/* Editorial Sidebar navigation */}
      <aside className="lg:w-[360px] lg:h-[calc(100dvh-6rem)] lg:sticky lg:top-24 border-b lg:border-b-0 lg:border-r border-on-surface/5 bg-background/50 backdrop-blur-3xl p-8 lg:p-12 flex flex-col z-20">
        <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
                <span className="h-[1px] w-8 bg-primary"></span>
                <span className="editorial-kicker">Culinary Registry</span>
            </div>
            <h2 className="text-display-lg text-4xl lg:text-5xl text-on-surface leading-tight">The <br /><span className="italic font-light">Manifest.</span></h2>
        </div>

        <nav className="flex flex-col gap-2 overflow-y-auto scrollbar-hide pr-2">
            <button
                onClick={() => setActiveCat(null)}
                className={`
                    group flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-500 text-left
                    ${activeCat === null ? 'bg-on-surface text-background cinematic-shadow scale-[1.02]' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}
                `}
            >
                <div className="flex flex-col">
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${activeCat === null ? 'text-primary' : 'opacity-40'}`}>Registry</span>
                    <span className="text-ui-label-bold text-[13px]">Full Collection</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-all duration-500 ${activeCat === null ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0 group-hover:opacity-40 group-hover:translate-x-0'}`} />
            </button>

            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCat(cat.id)}
                    className={`
                        group flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-500 text-left
                        ${activeCat === cat.id ? 'bg-on-surface text-background cinematic-shadow scale-[1.02]' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}
                    `}
                >
                    <div className="flex flex-col">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${activeCat === cat.id ? 'text-primary' : 'opacity-40'}`}>Sector</span>
                        <span className="text-ui-label-bold text-[13px]">{cat.nom.toUpperCase()}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-all duration-500 ${activeCat === cat.id ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0 group-hover:opacity-40 group-hover:translate-x-0'}`} />
                </button>
            ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-on-surface/5">
            <div className="p-6 bg-surface-container-high rounded-2xl border border-on-surface/5">
                <p className="editorial-kicker mb-2">Curator's Note</p>
                <p className="text-[11px] font-body italic text-on-surface-variant leading-relaxed">
                    "Every creation is a calibrated orchestration of heritage textures and neural triggers."
                </p>
            </div>
        </div>
      </aside>

      {/* Main Catalog View */}
      <main className="flex-1 min-w-0 p-8 lg:p-16 relative overflow-hidden bg-background">
        
        {/* Dynamic Header */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-12 mb-16 relative z-10">
            <div className="max-w-2xl space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-container text-primary border border-primary/10">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-ui-label-bold text-[9px] tracking-[0.3em]">Neural Recommendation Active</span>
                </div>
                <h1 className="text-display-lg text-4xl md:text-6xl lg:text-7xl text-on-surface leading-[0.9]">
                    {activeCat ? categories.find(c => c.id === activeCat)?.nom : 'Collection.'}
                </h1>
                <p className="text-lg font-body text-on-surface-variant leading-relaxed italic max-w-xl">
                    {activeCat ? categories.find(c => c.id === activeCat)?.description : 'A rigorous selection of gastronomic creations, designed with architectural precision.'}
                </p>
            </div>

            <div className="relative w-full xl:w-[400px] group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input 
                    type="text"
                    placeholder="LOOKUP SIGNATURE DISH..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-surface-container border-2 border-transparent rounded-3xl focus:outline-none focus:border-primary focus:bg-background transition-all cinematic-shadow text-ui-data-dense font-black text-on-surface uppercase placeholder:text-on-surface-variant/30"
                />
            </div>
        </div>

        {/* Cinematic Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-12 relative z-10">
            {filteredPlats.map((plat, idx) => {
                const isFeatured = idx === 0 && !search;
                return (
                    <motion.div 
                        key={plat.id} 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05, duration: 0.8 }}
                        className={`group relative flex flex-col cursor-pointer ${isFeatured ? 'md:col-span-2' : ''}`}
                        onClick={() => setSelectedPlat(plat)}
                    >
                        <div className={`editorial-card relative overflow-hidden ${isFeatured ? 'aspect-[21/9]' : 'aspect-[4/5]'}`}>
                            {plat.image ? (
                                <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-[1500ms] group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-on-surface/5 font-serif italic text-8xl">
                                    {plat.nom.charAt(0).toUpperCase()}
                                </div>
                            )}
                            
                            <div className="absolute inset-0 bg-on-surface opacity-0 group-hover:opacity-10 transition-opacity duration-1000" />
                            
                            {/* Badges */}
                            <div className="absolute top-6 left-6">
                                <div className="glass-premium px-4 py-1.5 rounded-full">
                                    <span className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em]">{plat.prix} DH</span>
                                </div>
                            </div>

                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addItem(plat);
                                }}
                                className="absolute bottom-6 right-6 w-14 h-14 bg-on-surface text-background rounded-full cinematic-shadow flex items-center justify-center transition-all duration-500 hover:bg-primary hover:scale-110 active:scale-90 group/btn"
                            >
                                <Plus className="w-6 h-6 transition-transform group-hover/btn:rotate-90" />
                            </button>

                            {/* View Reveal */}
                            <div className="absolute inset-0 bg-background/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-1000 flex items-center justify-center">
                                <div className="px-8 py-3 bg-background/80 rounded-full font-black text-on-surface uppercase text-[10px] tracking-[0.4em] translate-y-8 group-hover:translate-y-0 transition-transform duration-1000 cinematic-shadow border border-white/40">
                                    Analyze Details
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 px-2 space-y-4">
                            <div className="flex items-center gap-6">
                                <h3 className={`font-serif italic text-on-surface tracking-tight group-hover:text-primary transition-colors ${isFeatured ? 'text-4xl' : 'text-2xl'}`}>
                                    {plat.nom}
                                </h3>
                                <div className="flex-1 h-[1px] bg-on-surface/10" />
                            </div>

                            <div className="flex items-center gap-6 text-[9px] font-black text-on-surface-variant uppercase tracking-[0.3em] opacity-60">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" strokeWidth={1.5} />
                                    <span>{plat.temps_preparation} MIN PREP</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <UtensilsCrossed className="w-4 h-4 text-primary" strokeWidth={1.5} />
                                    <span>VERIFIED RECORD</span>
                                </div>
                            </div>

                            <p className="text-on-surface-variant font-body text-sm leading-relaxed opacity-70 line-clamp-2 italic">
                                {plat.description?.toUpperCase() || 'A DEFINITIVE EXPLORATION OF MOROCCAN GASTRONOMY THROUGH AN ARCHITECTURAL PRISM.'}
                            </p>
                        </div>
                    </motion.div>
                );
            })}
        </div>

        {/* Empty State */}
        {filteredPlats.length === 0 && (
            <div className="py-48 flex flex-col items-center justify-center text-on-surface-variant gap-10 opacity-20">
                <div className="w-32 h-32 rounded-full border-2 border-dashed border-on-surface flex items-center justify-center rotate-12">
                    <Info className="w-12 h-12" />
                </div>
                <div className="text-center space-y-4">
                    <h3 className="text-display-lg text-4xl italic">No matches detected.</h3>
                    <p className="text-ui-label-bold text-[10px] tracking-[0.4em]">ADJUST PARAMETERS TO RETRY SEARCH.</p>
                </div>
            </div>
        )}
      </main>

      {/* Dish Exploration Modal */}
      <Modal 
        isOpen={!!selectedPlat} 
        onClose={() => setSelectedPlat(null)} 
        title="Creation Manifest"
      >
        {selectedPlat && (
            <div className="space-y-12 animate-in zoom-in-95 duration-1000 p-2">
                <div className="relative editorial-card overflow-hidden aspect-video border-on-surface/5 p-3 bg-surface-container-low cinematic-shadow">
                    <div className="w-full h-full rounded-[2rem] overflow-hidden relative">
                        {selectedPlat.image ? (
                            <img src={selectedPlat.image} alt={selectedPlat.nom} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-surface-container" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 to-transparent" />
                        <div className="absolute bottom-8 left-8 text-background">
                            <h4 className="text-display-lg text-4xl md:text-5xl italic mb-2">{selectedPlat.nom}</h4>
                            <p className="text-primary text-[11px] font-black uppercase tracking-[0.4em]">Signature Tastify Archive</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-2">
                    <div className="space-y-6">
                        <span className="editorial-kicker">Culinary Context</span>
                        <p className="text-2xl font-serif italic text-on-surface leading-relaxed">
                            {selectedPlat.description || "A masterpiece of balance and traditional craftsmanship, meticulously orchestrated for the modern palate."}
                        </p>
                    </div>
                    <div className="flex flex-col justify-between gap-10">
                        <div className="flex flex-col gap-4 border-l-2 border-primary/20 pl-8">
                            <span className="text-ui-label-bold text-[10px] text-on-surface-variant opacity-60">Orchestration Window</span>
                            <div className="flex items-center gap-4 text-2xl text-on-surface tracking-tight font-body">
                                <Clock className="w-6 h-6 text-primary" strokeWidth={1.5} />
                                <span>{selectedPlat.temps_preparation} Minutes</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 border-l-2 border-primary/20 pl-8">
                            <span className="text-ui-label-bold text-[10px] text-on-surface-variant opacity-60">Session Value</span>
                            <div className="text-5xl font-black text-primary leading-none font-serif italic">
                                {selectedPlat.prix} <span className="text-lg font-black font-sans not-italic text-on-surface/40">DH</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 pt-4">
                    <button 
                        onClick={() => setSelectedPlat(null)}
                        className="flex-1 py-6 bg-surface-container text-on-surface text-[11px] font-black uppercase tracking-[0.3em] hover:bg-surface-container-highest transition-all"
                    >
                        Return to Registry
                    </button>
                    <button 
                        onClick={() => {
                            addItem(selectedPlat);
                            setSelectedPlat(null);
                        }}
                        className="flex-[2] py-6 bg-on-surface text-background text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all hover:bg-primary cinematic-shadow active:scale-95"
                    >
                        <span>Add to Selection</span>
                        <ArrowRight className="w-5 h-5 text-primary" strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
};

