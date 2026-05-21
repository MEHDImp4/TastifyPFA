import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { menuApi } from '../../api/menu';
import type { Categorie, Plat } from '../../api/menu';
import { useCartStore } from '../../store/cartStore';
import { Search, Clock, Info, Plus, Sparkles, ChevronRight, UtensilsCrossed } from 'lucide-react';
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

  const featuredPlat = filteredPlats.length > 0 ? filteredPlats[0] : null;
  const otherPlats = filteredPlats.slice(1);

  if (isLoading) return (
    <div className="flex-1 flex bg-background">
        <aside className="w-80 border-r border-on-surface/5 p-8 space-y-8 hidden xl:block">
            <Skeleton className="w-40 h-10 mb-8" />
            <div className="space-y-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="w-full h-12 rounded-2xl" />)}
            </div>
        </aside>
        <main className="flex-1 p-12 space-y-12">
            <div className="flex justify-between items-end gap-8">
                <div className="space-y-4">
                    <Skeleton className="w-64 h-12 rounded-2xl" />
                    <Skeleton className="w-[500px] h-4 rounded-full" />
                </div>
                <Skeleton className="w-80 h-16 rounded-3xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
                {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
            </div>
        </main>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-background selection:bg-primary/10 selection:text-primary overflow-hidden h-[calc(100vh-4rem)]">
      
      {/* Editorial Sidebar navigation */}
      <aside className="lg:w-[300px] border-b lg:border-b-0 lg:border-r border-on-surface/5 bg-background/50 backdrop-blur-3xl p-6 flex flex-col shrink-0">
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
                <span className="h-[1px] w-6 bg-primary"></span>
                <span className="editorial-kicker text-[8px]">Registry</span>
            </div>
            <h2 className="text-display-lg text-3xl text-on-surface leading-tight">The <br /><span className="italic font-light">Manifest.</span></h2>
        </div>

        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-2">
            <button
                onClick={() => setActiveCat(null)}
                className={`
                    group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-500 text-left
                    ${activeCat === null ? 'bg-on-surface text-background cinematic-shadow scale-[1.02]' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}
                `}
            >
                <div className="flex flex-col">
                    <span className="text-ui-label-bold text-[11px] uppercase tracking-wider">Collection</span>
                </div>
                <ChevronRight className={`w-3 h-3 transition-all duration-500 ${activeCat === null ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0 group-hover:opacity-40 group-hover:translate-x-0'}`} />
            </button>

            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCat(cat.id)}
                    className={`
                        group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-500 text-left
                        ${activeCat === cat.id ? 'bg-on-surface text-background cinematic-shadow scale-[1.02]' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}
                    `}
                >
                    <div className="flex flex-col">
                        <span className="text-ui-label-bold text-[11px] uppercase tracking-wider">{cat.nom}</span>
                    </div>
                    <ChevronRight className={`w-3 h-3 transition-all duration-500 ${activeCat === cat.id ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0 group-hover:opacity-40 group-hover:translate-x-0'}`} />
                </button>
            ))}
        </nav>
      </aside>

      {/* Main Catalog View */}
      <main className="flex-1 min-w-0 p-6 lg:p-10 flex flex-col overflow-hidden bg-background">
        
        {/* Dynamic Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 shrink-0">
            <div className="max-w-xl">
                <h1 className="text-display-lg text-4xl lg:text-5xl text-on-surface leading-tight italic">
                    {activeCat ? categories.find(c => c.id === activeCat)?.nom : 'The Catalog.'}
                </h1>
            </div>

            <div className="relative w-full xl:w-[350px] group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input 
                    type="text"
                    placeholder="LOOKUP CREATION..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface-container border-2 border-transparent rounded-2xl focus:outline-none focus:border-primary transition-all text-xs font-black text-on-surface uppercase placeholder:text-on-surface-variant/30"
                />
            </div>
        </div>

        {/* Scrollable Grid Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6 pb-8">
                {filteredPlats.map((plat, idx) => (
                    <motion.div 
                        key={plat.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group cursor-pointer flex flex-col gap-4"
                        onClick={() => setSelectedPlat(plat)}
                    >
                        <div className="editorial-card aspect-square relative overflow-hidden rounded-2xl border border-on-surface/5">
                            {plat.image ? (
                                <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" />
                            ) : (
                                <div className="w-full h-full bg-surface-container flex items-center justify-center italic text-on-surface/10 text-4xl font-serif">M</div>
                            )}
                            
                            <div className="absolute top-4 right-4">
                                <span className="glass-premium px-3 py-1 rounded-full text-[10px] font-black text-on-surface">{plat.prix} DH</span>
                            </div>

                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addItem(plat);
                                }}
                                className="absolute bottom-4 right-4 w-10 h-10 bg-on-surface text-background rounded-full cinematic-shadow flex items-center justify-center transition-all hover:bg-primary hover:scale-110 active:scale-90"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-1 px-1">
                            <h3 className="text-lg font-serif italic text-on-surface group-hover:text-primary transition-colors truncate">{plat.nom}</h3>
                            <p className="text-[10px] font-body text-on-surface-variant line-clamp-1 italic opacity-60 uppercase tracking-tight">{plat.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* Empty State */}
        {filteredPlats.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant opacity-20">
                <Info className="w-10 h-10 mb-4" />
                <h3 className="text-xl font-serif italic">No matches detected.</h3>
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
                        <div className="absolute bottom-8 left-8 text-background text-left">
                            <h4 className="text-display-lg text-4xl md:text-5xl italic mb-2">{selectedPlat.nom}</h4>
                            <p className="text-primary text-[11px] font-black uppercase tracking-[0.4em]">Signature Tastify Archive</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-2 text-left">
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
                        className="flex-1 py-6 bg-surface-container text-on-surface text-[11px] font-black uppercase tracking-[0.3em] hover:bg-surface-container-highest transition-all rounded-2xl"
                    >
                        Return to Registry
                    </button>
                    <button 
                        onClick={() => {
                            addItem(selectedPlat);
                            setSelectedPlat(null);
                        }}
                        className="flex-[2] py-6 bg-on-surface text-background text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all hover:bg-primary cinematic-shadow active:scale-95 rounded-2xl"
                    >
                        <span>Add to Selection</span>
                        <Plus className="w-5 h-5 text-primary" strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
};

