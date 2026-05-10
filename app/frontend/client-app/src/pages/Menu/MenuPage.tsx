import React, { useState, useEffect } from 'react';
import { menuApi, Categorie, Plat } from '../../api/menu';
import { useCartStore } from '../../store/cartStore';
import { Search, Loader2, Clock, Info, ShoppingCart, Plus } from 'lucide-react';

export const MenuPage: React.FC = () => {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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
    <div className="flex-1 flex items-center justify-center py-24">
        <Loader2 className="w-12 h-12 animate-spin text-teal" />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col animate-in fade-in duration-700">
      {/* Header with Search */}
      <section className="bg-white border-b border-gray-100 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-dark mb-4">Notre Menu</h1>
                <p className="text-gray-500 max-w-md">Découvrez nos spécialités préparées avec amour par nos chefs.</p>
            </div>
            <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                    type="text"
                    placeholder="Chercher un plat..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all shadow-sm"
                />
            </div>
        </div>
      </section>

      {/* Categories & Items */}
      <section className="max-w-7xl mx-auto px-6 py-12 w-full">
        {/* Categories Bar */}
        <div className="flex items-center gap-3 overflow-x-auto pb-8 scrollbar-hide">
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCat(cat.id)}
                    className={`
                        px-8 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all
                        ${activeCat === cat.id ? 'bg-teal text-white shadow-lg shadow-teal/20 scale-105' : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-300'}
                    `}
                >
                    {cat.nom}
                </button>
            ))}
        </div>

        {/* Plats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlats.map(plat => (
                <div key={plat.id} className="group bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                    <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                        {plat.image ? (
                            <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-4xl">
                                {plat.nom.charAt(0)}
                            </div>
                        )}
                        <div className="absolute top-6 right-6 flex gap-2">
                            <button 
                                onClick={() => addItem(plat)}
                                className="p-3 bg-teal text-white rounded-2xl shadow-lg hover:scale-110 active:scale-90 transition-all group/btn"
                                aria-label="Ajouter au panier"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                            <span className="px-4 py-2 bg-white/90 backdrop-blur-md text-dark font-bold rounded-2xl shadow-lg border border-white/50">
                                {plat.prix} DH
                            </span>
                        </div>
                    </div>
                    <div className="p-8">
                        <h3 className="text-xl font-bold text-dark mb-2 group-hover:text-teal transition-colors">{plat.nom}</h3>
                        <div className="flex items-center gap-4 text-xs text-gray-400 font-medium mb-4">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-teal" />
                                <span>{plat.temps_preparation} min</span>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 h-10">
                            {plat.description || 'Une délicieuse création signée Tastify.'}
                        </p>
                    </div>
                </div>
            ))}
        </div>

        {filteredPlats.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-4 opacity-50">
                <div className="p-10 bg-gray-50 rounded-full border border-dashed border-gray-200">
                    <Info className="w-12 h-12" />
                </div>
                <p className="text-lg font-medium">Aucun plat trouvé pour votre recherche.</p>
            </div>
        )}
      </section>
    </div>
  );
};
