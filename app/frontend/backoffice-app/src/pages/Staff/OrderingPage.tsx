import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { menuApi } from '../../api/menu';
import { salleApi } from '../../api/salle';
import type { Categorie, Plat } from '../../types/menu';
import type { Commande, Table } from '../../types/salle';
import { 
  ChevronLeft, 
  Search, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Loader2, 
  Send,
  Trash2,
  Clock
} from 'lucide-react';

export const OrderingPage: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [table, setTable] = useState<Table | null>(null);
  const [currentCommande, setCurrentCommande] = useState<Commande | null>(null);
  
  const [cart, setCart] = useState<{ plat: Plat; quantite: number; notes: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, platsRes, tablesRes, cmdRes] = await Promise.all([
          menuApi.getCategories(),
          menuApi.getPlats(),
          salleApi.getTables(),
          salleApi.getCommandeByTable(Number(tableId))
        ]);

        const sortedCats = catsRes.data.filter(c => c.est_active).sort((a, b) => a.ordre_affichage - b.ordre_affichage);
        setCategories(sortedCats);
        setPlats(platsRes.data.filter(p => p.est_active && p.est_disponible));
        if (sortedCats.length > 0) setActiveCat(sortedCats[0].id);
        
        const currentTable = tablesRes.data.find(t => t.id === Number(tableId));
        setTable(currentTable || null);
        
        if (cmdRes.data.length > 0) {
            setCurrentCommande(cmdRes.data[0]);
        }
      } catch (err) {
        console.error('Failed to load ordering data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [tableId]);

  const filteredPlats = plats.filter(p => 
    (activeCat === null || p.categorie === activeCat) &&
    (search === '' || p.nom.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (plat: Plat) => {
    setCart(prev => {
      const existing = prev.find(item => item.plat.id === plat.id);
      if (existing) {
        return prev.map(item => 
          item.plat.id === plat.id ? { ...item, quantite: item.quantite + 1 } : item
        );
      }
      return [...prev, { plat, quantite: 1, notes: '' }];
    });
  };

  const removeFromCart = (platId: number) => {
    setCart(prev => prev.filter(item => item.plat.id !== platId));
  };

  const updateQty = (platId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.plat.id === platId) {
        const newQty = Math.max(1, item.quantite + delta);
        return { ...item, quantite: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.plat.prix) * item.quantite), 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setIsSaving(true);
    
    const lignes = cart.map(item => ({
      plat: item.plat.id,
      quantite: item.quantite,
      notes: item.notes
    }));

    try {
      if (currentCommande) {
        await salleApi.addItemsToCommande(currentCommande.id, lignes);
      } else {
        await salleApi.createCommande({
          table: Number(tableId),
          type: 'SUR_PLACE',
          lignes: lignes
        });
      }
      navigate('/salle');
    } catch (err) {
      console.error('Failed to submit order', err);
      alert('Erreur lors de la prise de commande.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="h-full flex items-center justify-center text-teal"><Loader2 className="w-10 h-10 animate-spin" /></div>;

  return (
    <div className="h-full flex flex-col gap-6 -m-6 md:-m-8">
      {/* Header */}
      <div className="bg-dark p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/salle')} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-bold">Table #{table?.numero}</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                {currentCommande ? `Commande #${currentCommande.id} active` : 'Nouvelle commande'}
            </p>
          </div>
        </div>
        
        <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
                type="text"
                placeholder="Rechercher un plat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-dark-surface border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-teal"
            />
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Menu Section */}
        <div className="flex-1 flex flex-col min-w-0 p-6 pt-0 overflow-hidden">
          {/* Categories bar */}
          <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`
                    px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all
                    ${activeCat === cat.id ? 'bg-teal text-white shadow-lg shadow-teal/20' : 'bg-dark-surface text-gray-400 border border-white/5 hover:border-white/20'}
                `}
              >
                {cat.nom}
              </button>
            ))}
          </div>

          {/* Plats grid */}
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
            {filteredPlats.map(plat => (
              <button
                key={plat.id}
                onClick={() => addToCart(plat)}
                className="group flex flex-col text-left bg-dark-surface rounded-[2rem] border border-white/5 overflow-hidden hover:border-teal/40 transition-all active:scale-95 shadow-lg"
              >
                <div className="aspect-[4/3] relative">
                  {plat.image ? (
                    <img src={plat.image} className="w-full h-full object-cover" alt={plat.nom} />
                  ) : (
                    <div className="w-full h-full bg-[#1a323b] flex items-center justify-center text-gray-700 font-bold text-2xl uppercase opacity-20">
                      {plat.nom.charAt(0)}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 p-2 bg-teal text-white rounded-full opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 shadow-xl">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-sm mb-1 truncate">{plat.nom}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-teal font-mono text-sm font-bold">{plat.prix} DH</span>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{plat.temps_preparation}m</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart Section - Sidebar style */}
        <div className="w-[400px] bg-dark-surface border-l border-white/5 flex flex-col shadow-2xl">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-teal" />
                <h3 className="font-bold tracking-tight">Panier de la table</h3>
            </div>
            <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-gray-400">{cart.length} articles</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 opacity-50">
                <div className="p-8 bg-dark rounded-full border border-dashed border-white/10">
                    <Plus className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium">Le panier est vide</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.plat.id} className="p-4 bg-dark rounded-2xl border border-white/5 group animate-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="font-bold text-sm">{item.plat.nom}</h4>
                        <p className="text-xs text-teal font-mono mt-0.5">{item.plat.prix} DH / unité</p>
                    </div>
                    <button onClick={() => removeFromCart(item.plat.id)} className="p-1 text-gray-600 hover:text-terracotta transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-[#1a323b] rounded-xl p-1 px-3">
                        <button onClick={() => updateQty(item.plat.id, -1)} className="p-1 text-teal hover:bg-teal/10 rounded-lg"><Minus className="w-4 h-4" /></button>
                        <span className="font-mono font-bold text-sm w-6 text-center">{item.quantite}</span>
                        <button onClick={() => updateQty(item.plat.id, 1)} className="p-1 text-teal hover:bg-teal/10 rounded-lg"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="font-bold text-sm">{(parseFloat(item.plat.prix) * item.quantite).toFixed(2)} DH</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-dark border-t border-white/10">
            <div className="flex items-center justify-between mb-6">
                <span className="text-gray-400 font-medium">Total</span>
                <span className="text-2xl font-bold font-mono tracking-tighter text-teal">{cartTotal.toFixed(2)} DH</span>
            </div>
            
            <button 
                onClick={handleSubmitOrder}
                disabled={cart.length === 0 || isSubmitting}
                className={`
                    w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all
                    ${cart.length > 0 && !isSubmitting ? 'bg-teal text-white shadow-xl shadow-teal/20 hover:brightness-110 active:scale-[0.98]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
                `}
            >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                        <Send className="w-5 h-5" />
                        <span>Envoyer en cuisine</span>
                    </>
                )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
