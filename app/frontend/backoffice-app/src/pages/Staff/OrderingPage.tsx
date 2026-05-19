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
    <div className="h-[calc(100dvh-6rem)] flex flex-col -m-6 md:-m-8 animate-in fade-in duration-700 bg-background">
      {/* Precision Header */}
      <header className="bg-surface-container-lowest border-b border-surface-container-high p-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/salle')} className="p-3 bg-surface-container rounded-xl hover:bg-surface-container-high transition-all active:scale-90 border border-outline-variant/30">
            <ChevronLeft className="w-6 h-6" style={{ color: '#301400' }}  strokeWidth={2}/>
          </button>
          <div>
            <h2 className="text-lg font-bold font-sans tracking-tight" style={{ color: '#301400' }}>Station Table #{table?.numero}</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className={`w-2.5 h-2.5 rounded-xl ${currentCommande ? 'bg-primary animate-pulse' : 'bg-outline'}`} />
                <p className="text-[10px] uppercase tracking-widest font-sans font-bold font-sans" style={{ color: '#53443a' }}>
                    {currentCommande ? `Session Active • #${currentCommande.id}` : 'New Transaction'}
                </p>
            </div>
          </div>
        </div>
        
        <div className="relative w-80 hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#53443a' }}  strokeWidth={2}/>
            <input 
                type="text"
                placeholder="Lookup culinary data..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-container-low border border-surface-container-high rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-all font-sans"
                style={{ color: '#301400' }}
            />
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Menu Section - Catalog style */}
        <div className="flex-1 flex flex-col min-w-0 p-5 pt-6 overflow-hidden">
          {/* Categories bar - Minimalist Glass */}
          <div className="flex gap-3 overflow-x-auto pb-8 scrollbar-hide shrink-0">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`
                    px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest font-sans whitespace-nowrap transition-all duration-300 border
                    ${activeCat === cat.id ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/10 shadow-primary/20 scale-105' : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high hover:border-primary transition-colors'}
                `}
                style={{ color: activeCat === cat.id ? undefined : '#301400' }}
              >
                {cat.nom}
              </button>
            ))}
          </div>

          {/* Plats grid - Modern Bento */}
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 pb-8 scrollbar-hide">
            {filteredPlats.map(plat => (
              <button
                key={plat.id}
                onClick={() => addToCart(plat)}
                className="group flex flex-col text-left double-bezel bg-white p-3 transition-all duration-500 hover:scale-[1.03] hover:shadow-lg shadow-primary/10 hover:shadow-primary/5 active:scale-95 border-outline-variant/30"
              >
                <div className="aspect-[4/3] relative rounded-xl overflow-hidden bg-surface-container-low mb-4">
                  {plat.image ? (
                    <img src={plat.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={plat.nom} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xl uppercase italic font-display-accent" style={{ color: '#301400', opacity: 0.2 }}>
                      {plat.nom.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                  <div className="absolute top-3 right-3 w-10 h-10 bg-primary text-on-primary rounded-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 shadow-lg shadow-primary/10 flex items-center justify-center">
                    <Plus className="w-6 h-6"  strokeWidth={2}/>
                  </div>
                </div>
                <div className="px-1">
                  <h4 className="font-bold text-sm mb-2 truncate font-sans tracking-tight leading-none group-hover:text-primary transition-colors" style={{ color: '#301400' }}>{plat.nom}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold text-sm font-sans">{plat.prix}DH</span>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest font-sans" style={{ color: '#53443a' }}>
                        <Clock className="w-3.5 h-3.5"  strokeWidth={2}/>
                        <span>{plat.temps_preparation}m</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart Section - Operational Sidebar */}
        <aside className="w-[450px] bg-white border-l border-surface-container-high flex flex-col shadow-[0px_0px_100px_rgba(0,0,0,0.03)] z-10">
          <div className="p-5 border-b border-surface-container-high flex items-center justify-between bg-surface-container-lowest">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5"  strokeWidth={2}/>
                </div>
                <h3 className="font-bold font-sans text-sm tracking-tight" style={{ color: '#301400' }}>Operational Cart</h3>
            </div>
            <div className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest font-sans border border-outline-variant/30" style={{ color: '#301400' }}>
                {cart.length} ITEMS
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 animate-in zoom-in duration-700" style={{ color: '#53443a', opacity: 0.6 }}>
                <div className="w-20 h-20 rounded-xl bg-surface-container-low border-2 border-dashed border-outline-variant/30 flex items-center justify-center">
                    <Plus className="w-8 h-8"  strokeWidth={2}/>
                </div>
                <p className="text-sm font-display-accent italic">Transaction buffer is empty.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.plat.id} className="p-5 bg-surface-container-low rounded-xl border border-outline-variant/30 group animate-in slide-in-from-right-6 duration-500 transition-all hover:bg-white hover:shadow-lg shadow-primary/10 hover:shadow-primary/5">
                  <div className="flex justify-between items-start mb-5">
                    <div>
                        <h4 className="font-bold text-base font-sans tracking-tight" style={{ color: '#301400' }}>{item.plat.nom}</h4>
                        <p className="text-xs text-primary font-bold mt-1 uppercase tracking-widest font-sans">{item.plat.prix} DH / UNIT</p>
                    </div>
                    <button onClick={() => removeFromCart(item.plat.id)} className="p-2 transition-all active:scale-75" style={{ color: '#53443a' }}>
                        <Trash2 className="w-5 h-5 hover:text-error transition-colors"  strokeWidth={2}/>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-outline-variant/30 shadow-lg shadow-primary/10">
                        <button onClick={() => updateQty(item.plat.id, -1)} className="w-8 h-8 flex items-center justify-center hover:text-primary transition-colors" style={{ color: '#53443a' }}><Minus className="w-4 h-4"  strokeWidth={2}/></button>
                        <span className="font-bold text-sm w-8 text-center font-sans" style={{ color: '#301400' }}>{item.quantite}</span>
                        <button onClick={() => updateQty(item.plat.id, 1)} className="w-8 h-8 flex items-center justify-center hover:text-primary transition-colors" style={{ color: '#53443a' }}><Plus className="w-4 h-4"  strokeWidth={2}/></button>
                    </div>
                    <div className="font-bold text-sm font-sans" style={{ color: '#301400' }}>{(parseFloat(item.plat.prix) * item.quantite).toFixed(2)}DH</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 bg-surface-container-low border-t border-surface-container-high">
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: '#53443a' }}>Estimated Total</span>
                    <span className="text-sm font-bold opacity-70" style={{ color: '#53443a' }}>Incl. VAT</span>
                </div>
                <span className="text-2xl font-bold font-sans tracking-tighter" style={{ color: '#301400' }}>{cartTotal.toFixed(2)}DH</span>
            </div>
            
            <button 
                onClick={handleSubmitOrder}
                disabled={cart.length === 0 || isSubmitting}
                className={`
                    w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all duration-300
                    ${cart.length > 0 && !isSubmitting ? 'bg-primary text-on-primary shadow-lg shadow-primary/10 shadow-primary/20 hover:scale-[1.02] active:scale-95' : 'bg-surface-container text-outline cursor-not-allowed'}
                `}
            >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin"  strokeWidth={2}/> : (
                    <>
                        <span>Push to Kitchen</span>
                        <ArrowRight className="w-6 h-6"  strokeWidth={2}/>
                    </>
                )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
