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
  Trash2,
  Clock,
  ArrowRight
} from 'lucide-react';

const MUTABLE_COMMANDE_PRIORITY: Record<Commande['statut'], number> = {
  EN_COURS: 0,
  EN_CUISINE: 1,
  PRETE: 2,
  PAYEE: 3,
  ANNULEE: 4,
};

const selectCurrentCommande = (commandes: Commande[]) =>
  [...commandes].sort((left, right) => {
    const priorityDiff = MUTABLE_COMMANDE_PRIORITY[left.statut] - MUTABLE_COMMANDE_PRIORITY[right.statut];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return left.id - right.id;
  })[0] ?? null;

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
        
        setCurrentCommande(selectCurrentCommande(cmdRes.data));
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
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-8 h-8 animate-spin"  strokeWidth={2}/></div>;

  return (
    <div className="h-[calc(100dvh-5rem)] flex flex-col -m-6 md:-m-8 animate-in fade-in duration-700 bg-background overflow-hidden">
      {/* Precision Header */}
      <header className="bg-surface-container-high border-b-2 border-on-surface p-4 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/salle')} className="p-3 bg-background border-2 border-on-surface hover:bg-surface-container-highest transition-all active:translate-y-[2px]">
            <ChevronLeft className="w-5 h-5 text-on-surface"  strokeWidth={2.5}/>
          </button>
          <div>
            <h2 className="text-display-lg text-2xl text-on-surface leading-none">Order Entry Unit</h2>
            <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${currentCommande ? 'bg-secondary animate-pulse' : 'bg-on-surface/20'}`} />
                <p className="text-ui-label-bold text-[9px] text-on-surface-variant">
                    {currentCommande ? `TERMINAL ACTIVE • SESSION ID-${currentCommande.id}` : `NEW TRANSACTION • TABLE UNIT-${table?.numero}`}
                </p>
            </div>
          </div>
        </div>
        
        <div className="relative w-96 hidden md:block group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary"  strokeWidth={2.5}/>
            <input 
                type="text"
                placeholder="LOOKUP CULINARY DATA..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border-2 border-on-surface pl-12 pr-6 py-3 text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all placeholder:text-on-surface-variant/30 uppercase"
            />
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Menu Section - Catalog style */}
        <div className="flex-1 flex flex-col min-w-0 p-6 overflow-hidden">
          {/* Categories bar */}
          <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide shrink-0">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`
                    px-6 py-2 border-2 text-ui-label-bold text-[9px] whitespace-nowrap transition-all active:translate-y-[2px]
                    ${activeCat === cat.id ? 'bg-primary text-on-primary border-on-surface shadow-[4px_4px_0px_#301400]' : 'bg-surface-container border-on-surface/20 text-on-surface-variant hover:border-on-surface hover:text-on-surface'}
                `}
              >
                {cat.nom.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Plats grid - Technical Matrix */}
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 pb-8 scrollbar-hide">
            {filteredPlats.map(plat => (
              <button
                key={plat.id}
                onClick={() => addToCart(plat)}
                className="group flex flex-col text-left border-2 border-on-surface bg-surface-container overflow-hidden transition-all hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#301400] active:translate-y-[2px] active:shadow-none"
              >
                <div className="aspect-[4/3] relative border-b-2 border-on-surface bg-background">
                  {plat.image ? (
                    <img src={plat.image} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-300" alt={plat.nom} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-4xl text-on-surface/5 font-serif italic">
                      {plat.nom.charAt(0)}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-on-surface text-background px-2 py-0.5 text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    ADD TO CART
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1 justify-between gap-4">
                  <h4 className="text-ui-label-bold text-[11px] text-on-surface line-clamp-2 leading-tight uppercase">{plat.nom}</h4>
                  <div className="flex items-center justify-between border-t border-on-surface/10 pt-3">
                    <span className="text-ui-data-dense font-black text-primary text-base">{plat.prix} DH</span>
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-on-surface-variant uppercase tracking-widest">
                        <Clock className="w-3 h-3"  strokeWidth={2.5}/>
                        <span>{plat.temps_preparation}m</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart Section - Operational Buffer */}
        <aside className="w-[480px] bg-surface-container border-l-2 border-on-surface flex flex-col z-10 shadow-[-8px_0px_0px_rgba(48,20,0,0.05)]">
          <div className="p-6 border-b-2 border-on-surface flex items-center justify-between bg-on-surface text-background">
            <div className="flex items-center gap-4">
                <ShoppingCart className="w-5 h-5 text-secondary"  strokeWidth={2.5}/>
                <h3 className="text-ui-label-bold text-[12px] uppercase">Transaction Buffer</h3>
            </div>
            <div className="bg-background text-on-surface px-3 py-0.5 text-ui-data-dense font-black">
                {cart.length} LINE ITEMS
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-on-surface-variant opacity-20">
                <div className="w-24 h-24 border-2 border-dashed border-on-surface flex items-center justify-center">
                    <Plus className="w-10 h-10"  strokeWidth={2.5}/>
                </div>
                <p className="text-display-lg text-2xl italic uppercase tracking-tighter">Buffer Empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.plat.id} className="p-4 bg-background border-2 border-on-surface animate-in slide-in-from-right-6 transition-all hover:shadow-[4px_4px_0px_#301400]">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-4">
                        <h4 className="text-ui-label-bold text-[13px] text-on-surface leading-tight uppercase">{item.plat.nom}</h4>
                        <p className="text-ui-data-dense font-black text-primary text-[10px] mt-1 uppercase tracking-widest">{item.plat.prix} DH / UNIT</p>
                    </div>
                    <button onClick={() => removeFromCart(item.plat.id)} className="p-2 border-2 border-transparent hover:border-error text-on-surface-variant hover:text-error transition-all active:scale-90">
                        <Trash2 className="w-4 h-4"  strokeWidth={2.5}/>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-on-surface/10 pt-4">
                    <div className="flex items-center bg-surface-container border-2 border-on-surface overflow-hidden">
                        <button onClick={() => updateQty(item.plat.id, -1)} className="w-10 h-10 flex items-center justify-center hover:bg-on-surface hover:text-background transition-colors text-on-surface font-black border-r-2 border-on-surface">－</button>
                        <span className="text-ui-data-dense font-black text-base w-12 text-center text-on-surface">{item.quantite}</span>
                        <button onClick={() => updateQty(item.plat.id, 1)} className="w-10 h-10 flex items-center justify-center hover:bg-on-surface hover:text-background transition-colors text-on-surface font-black border-l-2 border-on-surface">＋</button>
                    </div>
                    <div className="text-ui-label-bold text-lg text-on-surface">{(parseFloat(item.plat.prix) * item.quantite).toFixed(2)} DH</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-8 bg-background border-t-2 border-on-surface">
            <div className="flex items-end justify-between mb-8">
                <div className="flex flex-col">
                    <span className="text-ui-label-bold text-[10px] text-on-surface-variant uppercase mb-1">AGGREGATED TOTAL</span>
                    <span className="text-ui-data-dense font-black text-on-surface/40 uppercase tracking-widest text-[9px]">INCL. TAXES & SERVICE</span>
                </div>
                <div className="text-right">
                    <span className="text-display-lg text-4xl text-on-surface leading-none">{cartTotal.toFixed(2)}</span>
                    <span className="text-ui-label-bold text-sm ml-2 text-on-surface">DH</span>
                </div>
            </div>
            
            <button 
                onClick={handleSubmitOrder}
                disabled={cart.length === 0 || isSubmitting}
                className={`
                    w-full py-5 border-2 border-on-surface flex items-center justify-center gap-4 text-ui-button font-ui-button transition-all
                    ${cart.length > 0 && !isSubmitting ? 'bg-primary text-on-primary shadow-[6px_6px_0px_#301400] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#301400] active:translate-y-[2px] active:shadow-none' : 'bg-surface-container text-on-surface/20 border-on-surface/20 cursor-not-allowed'}
                `}
            >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin"  strokeWidth={2.5}/> : (
                    <>
                        <span className="uppercase tracking-[0.25em] font-black">Transmit to Kitchen</span>
                        <ArrowRight className="w-5 h-5"  strokeWidth={2.5}/>
                    </>
                )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
