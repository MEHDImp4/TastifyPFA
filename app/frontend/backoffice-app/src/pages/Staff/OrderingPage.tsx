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
  ShoppingCart, 
  Loader2,
  Trash2,
  ArrowRight,
  Minus
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

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/></div>;

  return (
    <div className="h-full flex flex-col -m-4 bg-background overflow-hidden selection:bg-primary/10 selection:text-primary">
      {/* Precision Header */}
      <header className="bg-surface border-b-2 border-on-surface p-4 px-6 flex items-end justify-between shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/salle')} className="w-12 h-12 flex items-center justify-center bg-surface-container border-2 border-on-surface hover:bg-on-surface hover:text-background transition-all active:scale-95">
            <ChevronLeft className="w-6 h-6" strokeWidth={2.5}/>
          </button>
          <div>
            <h2 className="text-display-lg text-3xl text-on-surface leading-none uppercase tracking-tight">Table #{table?.numero}</h2>
            <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border ${currentCommande ? 'bg-secondary text-on-secondary border-secondary animate-pulse' : 'bg-surface-container text-on-surface-variant border-on-surface/20'}`}>
                    {currentCommande ? `ORDER ID-${currentCommande.id}` : 'NEW TRANSACTION'}
                </span>
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-2 py-0.5 bg-surface-container rounded border border-on-surface/10">{table?.capacite} SEATS</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
            <div className="relative w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary" strokeWidth={2.5}/>
                <input 
                    type="text"
                    placeholder="LOOKUP DATA..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-surface-container border-2 border-on-surface pl-12 pr-4 py-3 text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all placeholder:text-on-surface-variant/40 uppercase"
                />
            </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Section: 70% Product Selection */}
        <section className="flex-[7] bg-background flex flex-col min-w-0 border-r-2 border-on-surface overflow-hidden">
          
          {/* Category Tabs */}
          <nav className="flex px-6 py-4 gap-4 bg-surface-container-low border-b-2 border-on-surface overflow-x-auto custom-scrollbar shrink-0">
            <button
                onClick={() => setActiveCat(null)}
                className={`
                    px-6 py-2 border-2 text-ui-label-bold text-[10px] uppercase tracking-widest whitespace-nowrap transition-all active:scale-95
                    ${activeCat === null ? 'bg-primary text-on-primary border-on-surface shadow-[4px_4px_0px_#301400]' : 'bg-surface-container border-transparent text-on-surface-variant hover:border-on-surface/20 hover:text-on-surface'}
                `}
            >
                ALL CATEGORIES
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`
                    px-6 py-2 border-2 text-ui-label-bold text-[10px] uppercase tracking-widest whitespace-nowrap transition-all active:scale-95
                    ${activeCat === cat.id ? 'bg-primary text-on-primary border-on-surface shadow-[4px_4px_0px_#301400]' : 'bg-surface-container border-transparent text-on-surface-variant hover:border-on-surface/20 hover:text-on-surface'}
                `}
              >
                {cat.nom}
              </button>
            ))}
          </nav>

          {/* Menu Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
            {filteredPlats.map(plat => (
              <button
                key={plat.id}
                onClick={() => addToCart(plat)}
                className="group relative aspect-square bg-surface border-2 border-on-surface flex flex-col overflow-hidden transition-all hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#301400] active:translate-y-[2px] active:shadow-none text-left"
              >
                <div className="flex-1 w-full bg-surface-container relative">
                    {plat.image ? (
                        <img src={plat.image} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 opacity-90 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" alt={plat.nom} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-6xl text-on-surface/10 font-serif italic">
                        {plat.nom.charAt(0)}
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-4 flex justify-between items-end">
                    <div className="flex-1 pr-2">
                        <p className="font-ui-label-bold text-white text-[14px] leading-tight uppercase tracking-tight line-clamp-2">{plat.nom}</p>
                    </div>
                    <span className="font-ui-data-dense text-primary text-xl font-black">{plat.prix}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Right Section: 30% Order Sidebar */}
        <aside className="flex-[3] bg-surface flex flex-col min-w-[320px] shadow-[-8px_0_16px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-6 border-b-2 border-on-surface bg-surface-container-high shrink-0">
            <div className="flex items-center justify-between">
                <h3 className="font-ui-label-bold text-[12px] font-black tracking-widest text-primary uppercase flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" strokeWidth={2.5}/> CURRENT TICKET
                </h3>
                <span className="bg-background text-on-surface px-3 py-1 text-ui-data-dense font-black text-[10px] border border-on-surface/10 uppercase tracking-widest">
                    {cart.length} ITEMS
                </span>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-on-surface-variant opacity-20">
                <div className="w-20 h-20 border-4 border-dashed border-on-surface flex items-center justify-center">
                    <Plus className="w-8 h-8" strokeWidth={3}/>
                </div>
                <p className="text-ui-label-bold text-[11px] uppercase tracking-[0.3em] text-center px-8">Buffer Empty. Awaiting input.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.plat.id} className="p-3 bg-background border-2 border-on-surface flex justify-between items-start transition-all hover:shadow-[4px_4px_0px_#301400/20] animate-in slide-in-from-right-4">
                  <div className="flex gap-3 flex-1 min-w-0 pr-2">
                    <span className="font-ui-label-bold text-primary text-sm font-black">{item.quantite}x</span>
                    <div className="flex-1 min-w-0">
                        <p className="font-ui-label-bold text-[12px] text-on-surface uppercase tracking-tight truncate">{item.plat.nom}</p>
                        <p className="font-ui-data-dense text-[9px] text-on-surface-variant opacity-60 uppercase tracking-widest mt-0.5">{item.plat.prix} DH / EA</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-ui-data-dense text-ui-data-dense font-black">{(parseFloat(item.plat.prix) * item.quantite).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item.plat.id)} className="text-on-surface-variant/40 hover:text-error transition-colors p-1">
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5}/>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals & Actions */}
          <div className="p-6 bg-surface border-t-2 border-on-surface space-y-4 shrink-0">
            <div className="space-y-1">
                <div className="flex justify-between font-ui-data-dense text-[11px] text-on-surface-variant uppercase tracking-widest font-black">
                    <span>Subtotal</span>
                    <span>{cartTotal.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between font-ui-data-dense text-[11px] text-on-surface-variant uppercase tracking-widest font-black opacity-60">
                    <span>Tax & Svc</span>
                    <span>INCL.</span>
                </div>
                <div className="flex justify-between font-ui-label-bold text-2xl text-on-surface pt-3 border-t-2 border-on-surface border-dashed mt-2">
                    <span className="italic">TOTAL</span>
                    <span className="font-black text-primary">{cartTotal.toFixed(2)}</span>
                </div>
            </div>

            <button 
                onClick={handleSubmitOrder}
                disabled={cart.length === 0 || isSubmitting}
                className={`
                    w-full py-5 text-[14px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all border-2 border-on-surface
                    ${cart.length > 0 && !isSubmitting ? 'bg-primary-container text-on-primary-container shadow-[4px_4px_0px_#301400] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#301400] active:translate-y-[2px] active:shadow-none' : 'bg-surface-container text-on-surface/20 cursor-not-allowed'}
                `}
            >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3}/> : (
                    <>
                        <span>Fire to Kitchen</span>
                        <ArrowRight className="w-5 h-5" strokeWidth={2.5}/>
                    </>
                )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

