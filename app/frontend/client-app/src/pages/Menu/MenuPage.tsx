import React, { useState, useEffect } from 'react';
import { menuApi } from '../../api/menu';
import type { Categorie, Plat } from '../../api/menu';
import { useCartStore } from '../../store/cartStore';
import { Search, Clock, Info, Plus, ArrowRight, Sparkles, Filter } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { CardSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { useConfigStore } from '../../store/configStore';
import { getBrandName } from '../../components/branding/BrandWordmark';

export const MenuPage: React.FC = () => {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlat, setSelectedPlat] = useState<Plat | null>(null);
  const { addItem } = useCartStore();
  const config = useConfigStore(state => state.config);
  const brandName = getBrandName(config?.nom);

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
    <div className="flex-1 flex animate-in fade-in duration-700 bg-background">
        <aside className="w-80 border-r border-surface-container-high p-10 space-y-10 hidden xl:block">
            <Skeleton className="w-32 h-8 mb-10" />
            <div className="space-y-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="w-full h-12 rounded-xl" />)}
            </div>
        </aside>
        <main className="flex-1 p-6 md:p-16 space-y-8 md:space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-4">
                    <Skeleton className="w-48 md:w-64 h-8 md:h-12 rounded-xl" />
                    <Skeleton className="w-full md:w-96 h-4 rounded-full" />
                </div>
                <Skeleton className="w-full md:w-80 h-12 md:h-14 rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
            </div>
        </main>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col xl:flex-row bg-background animate-in fade-in duration-1000">
      {/* Cinematic Sidebar - Responsive */}
      <aside className="xl:w-96 xl:h-[calc(100dvh-6rem)] xl:sticky xl:top-24 border-b xl:border-b-0 xl:border-r border-surface-container-high bg-white/50 backdrop-blur-3xl p-5 md:p-10 flex flex-col z-20 overflow-y-auto scrollbar-hide">
        <div className="mb-8 xl:mb-16">
            <div className="flex items-center gap-3 text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-2 md:mb-4">
                <Filter className="w-3.5 h-3.5" />
                <span>Culinary Filter</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display-accent italic text-on-surface tracking-tight">The Library.</h2>
        </div>

        <nav className="flex flex-row xl:flex-col gap-3 md:gap-2 overflow-x-auto xl:overflow-x-visible pb-4 xl:pb-0 scrollbar-hide">
            <button
                onClick={() => setActiveCat(null)}
                className={`
                    group flex items-center justify-between px-5 md:px-6 py-3 md:py-5 rounded-xl md:rounded-2xl transition-all duration-500 text-left whitespace-nowrap xl:whitespace-normal shrink-0 xl:shrink
                    ${activeCat === null ? 'bg-primary text-white shadow-xl md:shadow-2xl shadow-primary/30 scale-105 xl:scale-105 z-10' : 'text-on-surface-variant bg-surface-container-low/50 xl:bg-transparent hover:bg-surface-container-low hover:text-on-surface'}
                `}
            >
                <div className="flex flex-col">
                    <span className={`text-[8px] md:text-xs font-black uppercase tracking-[0.2em] mb-0.5 md:mb-1 opacity-40 ${activeCat === null ? 'text-white' : ''}`}>Protocol</span>
                    <span className="font-sans font-bold text-sm md:text-lg tracking-tight">Full Archive</span>
                </div>
                <ArrowRight className={`hidden md:block w-5 h-5 transition-all duration-500 ${activeCat === null ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0 group-hover:opacity-40 group-hover:translate-x-[-8px]'}`} />
            </button>

            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCat(cat.id)}
                    className={`
                        group flex items-center justify-between px-5 md:px-6 py-3 md:py-5 rounded-xl md:rounded-2xl transition-all duration-500 text-left whitespace-nowrap xl:whitespace-normal shrink-0 xl:shrink
                        ${activeCat === cat.id ? 'bg-primary text-white shadow-xl md:shadow-2xl shadow-primary/30 scale-105 xl:scale-105 z-10' : 'text-on-surface-variant bg-surface-container-low/50 xl:bg-transparent hover:bg-surface-container-low hover:text-on-surface'}
                    `}
                >
                    <div className="flex flex-col">
                        <span className={`text-[8px] md:text-xs font-black uppercase tracking-[0.2em] mb-0.5 md:mb-1 opacity-40 ${activeCat === cat.id ? 'text-white' : ''}`}>Sector</span>
                        <span className="font-sans font-bold text-sm md:text-lg tracking-tight">{cat.nom}</span>
                    </div>
                    <ArrowRight className={`hidden md:block w-5 h-5 transition-all duration-500 ${activeCat === cat.id ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0 group-hover:opacity-40 group-hover:translate-x-[-8px]'}`} />
                </button>
            ))}
        </nav>

        <div className="hidden xl:block mt-16 pt-10 border-t border-surface-container-high text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-30 leading-relaxed">
                {brandName} Intelligence Hub <br/> Verified Gastronomy
            </p>
        </div>
      </aside>

      {/* Main Catalog View */}
      <main className="flex-1 min-w-0 p-5 md:p-16 2xl:p-24 relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-primary opacity-[0.02] blur-[100px] md:blur-[150px] -mr-20 md:-mr-40 -mt-20 md:-mt-40 pointer-events-none" />

        {/* Dynamic Header & Search */}
        <div className="flex flex-col 2xl:flex-row 2xl:items-end justify-between gap-8 md:gap-12 mb-12 md:mb-20 relative z-10">
            <div className="max-w-2xl space-y-4 md:space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-primary text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-primary/10">
                    <Sparkles className="w-3 h-3" />
                    <span>Live Catalog Protocol</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-display-accent italic text-on-surface leading-none tracking-tighter">
                    {activeCat ? categories.find(c => c.id === activeCat)?.nom : (config?.nom ? `${config.nom} Library.` : 'The Archives.')}
                </h1>
                <p className="text-lg md:text-xl text-on-surface-variant font-medium leading-relaxed opacity-70">
                    {activeCat ? categories.find(c => c.id === activeCat)?.description : (config?.description || 'Exploring the boundaries of traditional flavor through architectural precision.')}
                </p>
            </div>

            <div className="relative w-full 2xl:w-[450px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-40" />
                <input 
                    type="text"
                    placeholder="Search by flavor signature..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-14 md:pl-16 pr-8 py-5 md:py-6 bg-white border border-surface-container-high rounded-2xl md:rounded-[2rem] focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all shadow-xl shadow-on-surface/5 font-sans font-bold text-on-surface"
                />
            </div>
        </div>

        {/* Bento Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 md:gap-10 md:gap-12 relative z-10">
            {filteredPlats.map((plat, idx) => {
                const isFeatured = idx % 5 === 0;
                return (
                    <div 
                        key={plat.id} 
                        className={`group relative flex flex-col double-bezel p-3 md:p-4 bg-white transition-all duration-1000 animate-in slide-in-from-bottom-12 fade-in hover:scale-[1.03] hover:shadow-[0px_40px_100px_rgba(0,64,224,0.12)] cursor-pointer ${isFeatured ? 'md:col-span-2 2xl:col-span-2' : ''}`}
                        onClick={() => setSelectedPlat(plat)}
                        style={{ animationDelay: `${idx * 80}ms` }}
                    >
                        <div className={`relative rounded-2xl overflow-hidden bg-surface-container-low transition-all duration-1000 ${isFeatured ? 'aspect-video md:aspect-[21/9]' : 'aspect-[4/5]'}`}>
                            {plat.image ? (
                                <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover transition-transform duration-2000 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-on-surface-variant opacity-10 font-display-accent italic text-7xl md:text-9xl">
                                    {plat.nom.charAt(0)}
                                </div>
                            )}
                            
                            {/* Glass Badges */}
                            <div className="absolute top-4 md:top-6 left-4 md:left-6 flex flex-col gap-3">
                                <div className="glass px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-sans font-black text-[9px] md:text-[10px] text-on-surface uppercase tracking-[0.2em] shadow-xl border border-white/20">
                                    {plat.prix} DH
                                </div>
                            </div>

                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addItem(plat);
                                }}
                                className="absolute top-4 md:top-6 right-4 md:right-6 w-12 md:w-14 h-12 md:h-14 bg-primary text-white rounded-xl md:rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-90 group/btn overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-500" />
                                <Plus className="w-6 md:w-7 h-6 md:h-7 relative z-10 transition-transform group-hover/btn:rotate-90" />
                            </button>

                            {/* Floating "Explore" reveal */}
                            <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-center justify-center">
                                <div className="px-6 md:px-8 py-3 md:py-4 bg-white rounded-xl font-bold text-on-surface uppercase text-[10px] md:text-xs tracking-[0.3em] translate-y-8 group-hover:translate-y-0 transition-transform duration-700 shadow-2xl">
                                    Explore Creation
                                </div>
                            </div>
                        </div>

                        <div className="p-5 md:p-8 pb-4 flex flex-col flex-1">
                            <div className="flex items-center gap-4 mb-3 md:mb-4">
                                <h3 className={`font-sans font-black text-on-surface tracking-tighter leading-none uppercase italic group-hover:text-primary transition-colors ${isFeatured ? 'text-2xl md:text-4xl' : 'text-xl md:text-2xl'}`}>
                                    {plat.nom}
                                </h3>
                                <div className="flex-1 h-[2px] bg-surface-container-high opacity-40" />
                            </div>

                            <div className="flex items-center gap-6 md:gap-8 mb-4 md:mb-6 text-[9px] md:text-[10px] text-on-surface-variant font-black uppercase tracking-[0.2em] opacity-40">
                                <div className="flex items-center gap-2 md:gap-2.5">
                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                    <span>{plat.temps_preparation} MIN PREP</span>
                                </div>
                                <div className="flex items-center gap-2 md:gap-2.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                                    <span>SECURED</span>
                                </div>
                            </div>

                            <p className="text-on-surface-variant text-sm md:text-base font-medium leading-relaxed opacity-60 line-clamp-2 italic font-display-accent">
                                {plat.description || 'A definitive exploration of traditional Moroccan gastronomy through an architectural lens.'}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Empty State */}
        {filteredPlats.length === 0 && (
            <div className="py-40 md:py-60 flex flex-col items-center justify-center text-on-surface-variant gap-8 md:gap-10 animate-in zoom-in-95 duration-1000 opacity-30">
                <div className="w-24 md:w-32 h-24 md:h-32 rounded-full bg-surface-container-low border-2 border-dashed border-surface-container-high flex items-center justify-center">
                    <Info className="w-10 md:w-12 h-10 md:h-12" />
                </div>
                <div className="text-center space-y-4 px-5">
                    <h3 className="text-3xl md:text-4xl font-display-accent italic">No records found.</h3>
                    <p className="text-[10px] md:text-sm font-black uppercase tracking-[0.4em]">Adjust your neural parameters.</p>
                </div>
            </div>
        )}
      </main>

      {/* Dish Exploration Modal */}
      <Modal 
        isOpen={!!selectedPlat} 
        onClose={() => setSelectedPlat(null)} 
        title="Creation Data"
      >
        {selectedPlat && (
            <div className="space-y-8 md:space-y-12 animate-in zoom-in-95 duration-700">
                <div className="relative rounded-2xl md:rounded-[2rem] overflow-hidden aspect-video double-bezel p-2 md:p-3 bg-white">
                    <div className="w-full h-full rounded-xl md:rounded-[1.5rem] overflow-hidden relative">
                        {selectedPlat.image ? (
                            <img src={selectedPlat.image} alt={selectedPlat.nom} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-surface-container-low" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 text-white">
                            <h4 className="text-2xl md:text-4xl font-display-accent italic mb-2 tracking-tight">{selectedPlat.nom}</h4>
                            <p className="text-white/60 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em]">Signature Formulation</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                    <div className="space-y-4">
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-primary">Context</span>
                        <p className="text-base md:text-lg font-medium text-on-surface leading-relaxed font-display-accent italic">
                            {selectedPlat.description || "A masterpiece of balanced flavors and traditional Moroccan craftsmanship, meticulously orchestrated for the modern palate."}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-6 md:space-y-6">
                        <div className="flex flex-col gap-1 md:gap-2">
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-40">Orchestration Time</span>
                            <div className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-bold font-sans text-on-surface tracking-tight">
                                <Clock className="w-4 md:w-5 h-4 md:h-5 text-primary" />
                                <span>{selectedPlat.temps_preparation} Min</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 md:gap-2">
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-40">Market Value</span>
                            <div className="text-2xl md:text-3xl font-black font-sans text-primary tracking-tighter">
                                {selectedPlat.prix} DH
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chef's Pairing Insight */}
                <div className="p-6 md:p-8 bg-surface-container-low rounded-2xl md:rounded-[2rem] border border-surface-container-high relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-5 blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                    <div className="relative z-10 space-y-3 md:space-y-4">
                        <div className="flex items-center gap-3 text-primary font-black uppercase tracking-[0.3em] text-[9px] md:text-[10px]">
                            <Sparkles className="w-4 h-4" />
                            <span>Chef's Pairing Insight</span>
                        </div>
                        <p className="text-xs md:text-sm font-bold text-on-surface-variant leading-relaxed">
                            Recommended with our signature <span className="text-primary italic">Mint Infusion Protocol</span> or a dry Moroccan terroir white.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 md:gap-6 pt-2 md:pt-4">
                    <button 
                        onClick={() => setSelectedPlat(null)}
                        className="flex-1 py-4 md:py-5 glass text-on-surface rounded-xl md:rounded-2xl font-bold text-xs md:text-sm uppercase tracking-widest transition-all hover:bg-white active:scale-95 border border-surface-container-high"
                    >
                        Return to Library
                    </button>
                    <button 
                        onClick={() => {
                            addItem(selectedPlat);
                            setSelectedPlat(null);
                        }}
                        className="flex-[2] py-4 md:py-5 bg-primary text-white rounded-xl md:rounded-2xl font-bold text-base md:text-lg flex items-center justify-center gap-3 md:gap-4 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 active:scale-95"
                    >
                        <span>Authorize Add to Cart</span>
                        <ArrowRight className="w-5 md:w-6 h-5 md:h-6" />
                    </button>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
};

// Internal utility to verify icon imports
const ShieldCheck = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);
