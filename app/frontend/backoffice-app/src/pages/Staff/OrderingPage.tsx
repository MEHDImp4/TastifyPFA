import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { menuApi } from '../../api/menu';
import { salleApi } from '../../api/salle';
import type { Categorie, Plat } from '../../types/menu';
import type { Commande, Table } from '../../types/salle';
import { 
  ArrowLeft,
  Search, 
  Plus, 
  Loader2,
  Trash2,
  Send,
  Minus,
  Edit2
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
    <div className="h-screen w-screen flex flex-col bg-surface-main -m-staff-margin p-0 selection:bg-primary/20 selection:text-primary font-body overflow-hidden">
      
      {/* Contextual Top Bar */}
      <header className="flex-none flex items-center justify-between border-b border-outline-variant bg-surface-main px-staff-margin py-unit-sm h-16">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/salle')} className="p-2 rounded hover:bg-surface-container-high transition-all text-on-surface-variant">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="font-serif text-xl font-black text-on-surface tracking-widest uppercase">
             Table {table?.numero || '??'}
          </div>
          <span className="bg-surface-container-high px-2 py-0.5 rounded font-sans text-[10px] font-black text-on-surface-variant ml-2 border border-outline-variant uppercase tracking-widest">
            Party of {table?.capacite || 0}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary" />
            <input 
              type="text"
              placeholder="SEARCH MENU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 h-10 bg-surface-container-low border border-outline-variant pl-10 pr-4 rounded font-sans text-xs font-bold text-on-surface focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Menu Selection */}
        <section data-testid="menu-catalog" className="flex-[7] h-full border-r border-outline-variant bg-surface-container-lowest flex flex-col min-w-0">
          {/* Categories Horizontal Nav */}
          <div className="flex-none flex overflow-x-auto border-b border-outline-variant bg-surface-container py-2 px-staff-gutter gap-2 custom-scrollbar">
            <button
                onClick={() => setActiveCat(null)}
                className={`px-4 py-2 rounded font-sans text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCat === null ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`px-4 py-2 rounded font-sans text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCat === cat.id ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}
              >
                {cat.nom}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto p-staff-margin grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-unit-md auto-rows-max custom-scrollbar">
            {filteredPlats.map(plat => (
              <button
                key={plat.id}
                onClick={() => addToCart(plat)}
                className={`
                  group bg-surface-container border border-outline-variant rounded-lg p-unit-md text-left flex flex-col justify-between h-36 transition-all relative overflow-hidden
                  hover:border-primary hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary active:scale-[0.98]
                  ${!plat.est_disponible ? 'opacity-40 grayscale cursor-not-allowed' : ''}
                `}
                disabled={!plat.est_disponible}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-body text-[15px] font-bold text-on-surface leading-tight line-clamp-2">{plat.nom}</span>
                  <span className="font-sans text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">
                    {categories.find(c => c.id === plat.categorie)?.nom}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-sans text-[16px] font-black text-primary">{parseFloat(plat.prix).toFixed(0)} DH</span>
                  <div className="size-6 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                    <Plus className="w-3 h-3 text-on-surface group-hover:text-on-primary" />
                  </div>
                </div>
                {!plat.est_disponible && (
                   <span className="absolute top-2 right-2 px-2 py-0.5 bg-error text-on-error font-sans text-[9px] font-black uppercase tracking-tighter rounded">SOLD OUT</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Right Panel: Active Ticket */}
        <section data-testid="ordering-cart" className="flex-[3] h-full bg-surface-container-lowest flex flex-col min-w-[320px] shadow-2xl z-10">
          {/* Ticket Header */}
          <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low h-16 shrink-0">
            <span className="font-sans text-[12px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Active Ticket</span>
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-background border border-outline-variant/30">
               <span className="font-sans text-[11px] font-bold text-primary tabular-nums">{cart.length}</span>
               <span className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Items</span>
            </div>
          </div>

          {/* Ticket Items List */}
          <div className="flex-1 overflow-y-auto bg-surface-container-lowest custom-scrollbar">
            {cart.length === 0 ? (
               <div data-testid="cart-empty" className="h-full flex flex-col items-center justify-center p-8 opacity-10">
                  <Plus className="w-12 h-12 stroke-[0.5]" />
                  <p className="font-sans text-[10px] font-black uppercase tracking-[0.4em] mt-4 text-center">Ticket Buffer Empty</p>
               </div>
            ) : (
              cart.map((item, idx) => (
                <div key={`${item.plat.id}-${idx}`} data-testid={`cart-item-${item.plat.id}`} className="p-unit-md border-b border-outline-variant hover:bg-surface-container transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 min-w-0 pr-2">
                      <span className="font-sans text-[15px] font-black text-primary w-6 text-right tabular-nums">{item.quantite}x</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-[15px] font-bold text-on-surface truncate leading-tight uppercase tracking-tight">{item.plat.nom}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => updateQty(item.plat.id, -1)} data-testid="qty-minus" className="p-1 rounded bg-surface-container-high border border-outline-variant hover:bg-primary hover:text-on-primary transition-all">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-sans text-xs font-black text-on-surface tabular-nums">{item.quantite}</span>
                          <button onClick={() => addToCart(item.plat)} data-testid="qty-plus" className="p-1 rounded bg-surface-container-high border border-outline-variant hover:bg-primary hover:text-on-primary transition-all">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="font-sans text-[14px] font-black text-on-surface tabular-nums">{(parseFloat(item.plat.prix) * item.quantite).toFixed(0)} DH</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeFromCart(item.plat.id)} data-testid="remove-item" className="p-1.5 rounded hover:bg-error/10 text-error/40 hover:text-error">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {item.notes && (
                    <div className="ml-9 mt-1.5 p-2 bg-primary/5 border-l-2 border-primary rounded-r">
                      <p className="font-sans text-[10px] font-black text-primary uppercase tracking-widest leading-none">NOTE: {item.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Ticket Footer / Summary */}
          <div className="flex-none border-t border-outline-variant bg-surface-container-low p-6 flex flex-col gap-unit-md shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
            <div className="space-y-1">
              <div className="flex justify-between items-center font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">
                <span>Subtotal</span>
                <span className="tabular-nums">{cartTotal.toFixed(0)} DH</span>
              </div>
              <div className="flex justify-between items-center font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">
                <span>Tax & Service</span>
                <span>INCL.</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-outline-variant border-dashed">
              <span className="font-serif text-xl font-black text-on-surface italic tracking-tight">TOTAL</span>
              <span className="font-sans text-2xl font-black text-primary tabular-nums">{cartTotal.toFixed(0)} DH</span>
            </div>

            <button 
              onClick={handleSubmitOrder}
              disabled={cart.length === 0 || isSubmitting}
              aria-label="Envoyer"
              data-testid="order-submit"
              className={`
                w-full h-14 mt-2 rounded-md font-sans text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 border-2
                ${cart.length > 0 && !isSubmitting ? 'bg-primary border-primary text-on-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]' : 'bg-transparent border-outline-variant text-on-surface-variant/20 cursor-not-allowed'}
              `}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3}/> : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send to Kitchen</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};


