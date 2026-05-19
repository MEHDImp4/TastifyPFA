import React, { useState, useEffect } from 'react';
import { menuApi } from '../../api/menu';
import type { Categorie, Plat } from '../../api/menu';
import { useCartStore } from '../../store/cartStore';
import { Search, Clock, Info, Plus, ArrowRight, Sparkles, Filter, ChevronRight, UtensilsCrossed } from 'lucide-react';
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
    <div className="flex-1 flex bg-[#fff8f5]">
        <aside className="w-80 border-r border-[#d8c2b6] p-10 space-y-10 hidden xl:block">
            <Skeleton className="w-32 h-8 mb-10" />
            <div className="space-y-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="w-full h-12 rounded-xl" />)}
            </div>
        </aside>
        <main className="flex-1 p-16 space-y-12">
            <div className="flex justify-between items-end gap-6">
                <div className="space-y-4">
                    <Skeleton className="w-64 h-12 rounded-xl" />
                    <Skeleton className="w-96 h-4 rounded-full" />
                </div>
                <Skeleton className="w-80 h-14 rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
            </div>
        </main>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col xl:flex-row bg-[#fff8f5] selection:bg-[#8d4e1c]/10 selection:text-[#8d4e1c]">
      
      {/* Tactical Sidebar navigation */}
      <aside className="xl:w-[400px] xl:h-[calc(100dvh-5rem)] xl:sticky xl:top-20 border-b xl:border-b-0 xl:border-r border-[#d8c2b6] bg-white/50 backdrop-blur-3xl p-10 flex flex-col z-20">
        <div className="mb-16">
            <div className="flex items-center gap-3 text-[#8d4e1c] font-black uppercase tracking-[0.4em] text-[10px] mb-4">
                <Filter className="w-4 h-4" />
                <span>Archive Culinaire</span>
            </div>
            <h2 className="text-5xl font-serif italic text-[#301400] tracking-tighter">La Carte.</h2>
        </div>

        <nav className="flex flex-col gap-2 overflow-y-auto scrollbar-hide pr-2">
            <button
                onClick={() => setActiveCat(null)}
                className={`
                    group flex items-center justify-between px-6 py-5 rounded-2xl transition-all duration-500 text-left
                    ${activeCat === null ? 'bg-[#301400] text-white shadow-2xl shadow-black/20 scale-105 z-10' : 'text-[#53443a] hover:bg-[#fff1ea] hover:text-[#301400]'}
                `}
            >
                <div className="flex flex-col">
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-40 ${activeCat === null ? 'text-[#8d4e1c]' : ''}`}>Protocole</span>
                    <span className="font-bold text-lg tracking-tight">Vue d'ensemble</span>
                </div>
                <ChevronRight className={`w-5 h-5 transition-all duration-500 ${activeCat === null ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0 group-hover:opacity-40 group-hover:translate-x-0'}`} />
            </button>

            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCat(cat.id)}
                    className={`
                        group flex items-center justify-between px-6 py-5 rounded-2xl transition-all duration-500 text-left
                        ${activeCat === cat.id ? 'bg-[#301400] text-white shadow-2xl shadow-black/20 scale-105 z-10' : 'text-[#53443a] hover:bg-[#fff1ea] hover:text-[#301400]'}
                    `}
                >
                    <div className="flex flex-col">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-40 ${activeCat === cat.id ? 'text-[#8d4e1c]' : ''}`}>Secteur</span>
                        <span className="font-bold text-lg tracking-tight">{cat.nom}</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-all duration-500 ${activeCat === cat.id ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0 group-hover:opacity-40 group-hover:translate-x-0'}`} />
                </button>
            ))}
        </nav>

        <div className="mt-auto pt-10 border-t border-[#d8c2b6]/30">
            <div className="p-6 bg-[#fff1ea] rounded-2xl border border-[#ffe3d2]">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8d4e1c] mb-2">Note du Chef</p>
                <p className="text-xs font-bold text-[#301400]/60 leading-relaxed italic">
                    "Chaque création est une orchestration millimétrée de saveurs et de textures."
                </p>
            </div>
        </div>
      </aside>

      {/* Main Catalog View */}
      <main className="flex-1 min-w-0 p-8 md:p-16 2xl:p-24 relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#8d4e1c]/5 blur-[150px] -mr-40 -mt-40 pointer-events-none" />

        {/* Dynamic Header */}
        <div className="flex flex-col 2xl:flex-row 2xl:items-end justify-between gap-12 mb-24 relative z-10">
            <div className="max-w-2xl space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#fff1ea] text-[#8d4e1c] text-[10px] font-black uppercase tracking-widest border border-[#8d4e1c]/10">
                    <Sparkles className="w-4 h-4" />
                    <span>Catalogue Privé Tastify</span>
                </div>
                <h1 className="text-7xl md:text-9xl font-serif italic text-[#301400] leading-[0.85] tracking-tighter">
                    {activeCat ? categories.find(c => c.id === activeCat)?.nom : 'Exploration.'}
                </h1>
                <p className="text-xl text-[#53443a] font-medium leading-relaxed opacity-70 italic max-w-xl">
                    {activeCat ? categories.find(c => c.id === activeCat)?.description : 'Découvrez une sélection rigoureuse de créations gastronomiques conçues avec une précision architecturale.'}
                </p>
            </div>

            <div className="relative w-full 2xl:w-[450px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#53443a] opacity-40" />
                <input 
                    type="text"
                    placeholder="Rechercher une signature..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-16 pr-8 py-6 bg-[#fff1ea] border border-[#ffe3d2] rounded-[2rem] focus:outline-none focus:ring-8 focus:ring-[#8d4e1c]/5 focus:border-[#8d4e1c] transition-all shadow-xl shadow-[#301400]/5 font-bold text-[#301400]"
                />
            </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-12 relative z-10">
            {filteredPlats.map((plat, idx) => {
                const isFeatured = idx === 0 || idx === 7;
                return (
                    <div 
                        key={plat.id} 
                        className={`group relative flex flex-col bg-white transition-all duration-1000 animate-in slide-in-from-bottom-12 fade-in hover:shadow-[0_40px_100px_rgba(48,20,0,0.12)] cursor-pointer ${isFeatured ? 'md:col-span-2 2xl:col-span-2' : ''}`}
                        onClick={() => setSelectedPlat(plat)}
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <div className={`relative overflow-hidden bg-[#fff1ea] transition-all duration-1000 ${isFeatured ? 'aspect-video md:aspect-[21/9]' : 'aspect-[4/5]'} rounded-[2.5rem]`}>
                            {plat.image ? (
                                <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover transition-transform duration-2000 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#301400]/5 font-serif italic text-9xl">
                                    {plat.nom.charAt(0)}
                                </div>
                            )}
                            
                            {/* Badges */}
                            <div className="absolute top-8 left-8 flex flex-col gap-3">
                                <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-2xl font-black text-[10px] text-[#301400] uppercase tracking-[0.2em] shadow-2xl border border-white/50">
                                    {plat.prix} DH
                                </div>
                            </div>

                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addItem(plat);
                                }}
                                className="absolute bottom-8 right-8 w-16 h-16 bg-[#301400] text-white rounded-3xl shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-90 group/btn"
                            >
                                <Plus className="w-8 h-8 transition-transform group-hover/btn:rotate-90" />
                            </button>

                            {/* View Reveal */}
                            <div className="absolute inset-0 bg-[#301400]/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-center justify-center">
                                <div className="px-8 py-4 bg-white rounded-2xl font-bold text-[#301400] uppercase text-xs tracking-[0.3em] translate-y-8 group-hover:translate-y-0 transition-transform duration-700 shadow-2xl">
                                    Détails Création
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 px-4 flex flex-col flex-1">
                            <div className="flex items-center gap-4 mb-4">
                                <h3 className={`font-serif italic text-[#301400] tracking-tight group-hover:text-[#8d4e1c] transition-colors ${isFeatured ? 'text-4xl' : 'text-3xl'}`}>
                                    {plat.nom}
                                </h3>
                                <div className="flex-1 h-[1px] bg-[#d8c2b6] opacity-30" />
                            </div>

                            <div className="flex items-center gap-8 mb-6 text-[10px] text-[#53443a] font-black uppercase tracking-[0.2em] opacity-40">
                                <div className="flex items-center gap-2.5">
                                    <Clock className="w-4 h-4 text-[#8d4e1c]" />
                                    <span>{plat.temps_preparation} MIN PREP</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <UtensilsCrossed className="w-4 h-4 text-[#8d4e1c]" />
                                    <span>VÉRIFIÉ</span>
                                </div>
                            </div>

                            <p className="text-[#53443a] text-lg font-medium leading-relaxed opacity-60 line-clamp-2 italic font-serif">
                                {plat.description || 'Une exploration définitive de la gastronomie marocaine à travers un prisme architectural.'}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Empty State */}
        {filteredPlats.length === 0 && (
            <div className="py-60 flex flex-col items-center justify-center text-[#53443a] gap-10 opacity-30">
                <div className="w-32 h-32 rounded-full bg-[#fff1ea] border-2 border-dashed border-[#ffe3d2] flex items-center justify-center">
                    <Info className="w-12 h-12" />
                </div>
                <div className="text-center space-y-4">
                    <h3 className="text-4xl font-serif italic">Aucun résultat trouvé.</h3>
                    <p className="text-xs font-black uppercase tracking-[0.4em]">Ajustez vos paramètres de recherche.</p>
                </div>
            </div>
        )}
      </main>

      {/* Dish Exploration Modal */}
      <Modal 
        isOpen={!!selectedPlat} 
        onClose={() => setSelectedPlat(null)} 
        title="Données Création"
      >
        {selectedPlat && (
            <div className="space-y-12 animate-in zoom-in-95 duration-700 p-2">
                <div className="relative rounded-[2.5rem] overflow-hidden aspect-video border border-[#d8c2b6] p-3 bg-white">
                    <div className="w-full h-full rounded-[2rem] overflow-hidden relative">
                        {selectedPlat.image ? (
                            <img src={selectedPlat.image} alt={selectedPlat.nom} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-[#fff1ea]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-10 left-10 text-white">
                            <h4 className="text-5xl font-serif italic mb-2 tracking-tight">{selectedPlat.nom}</h4>
                            <p className="text-[#8d4e1c] text-[10px] font-black uppercase tracking-[0.4em]">Signature Tastify</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8d4e1c]">Contexte Culinaire</span>
                        <p className="text-2xl font-serif italic text-[#301400] leading-relaxed">
                            {selectedPlat.description || "Un chef-d'œuvre d'équilibre et de savoir-faire traditionnel, méticuleusement orchestré pour le palais moderne."}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#53443a] opacity-40">Temps d'Orchestration</span>
                            <div className="flex items-center gap-3 text-2xl font-bold text-[#301400] tracking-tight">
                                <Clock className="w-6 h-6 text-[#8d4e1c]" />
                                <span>{selectedPlat.temps_preparation} Minutes</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#53443a] opacity-40">Valeur de Session</span>
                            <div className="text-5xl font-bold text-[#8d4e1c] tracking-tighter">
                                {selectedPlat.prix} DH
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 pt-4">
                    <button 
                        onClick={() => setSelectedPlat(null)}
                        className="flex-1 py-5 bg-[#fff1ea] text-[#301400] rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#ffe3d2] transition-all"
                    >
                        Retour Archive
                    </button>
                    <button 
                        onClick={() => {
                            addItem(selectedPlat);
                            setSelectedPlat(null);
                        }}
                        className="flex-[2] py-5 bg-[#301400] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-4 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/20"
                    >
                        <span>Ajouter à la Sélection</span>
                        <ArrowRight className="w-6 h-6 text-[#8d4e1c]" />
                    </button>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
};

