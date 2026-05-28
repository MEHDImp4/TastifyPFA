import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { menuApi } from '../../api/menu';
import { salleApi } from '../../api/salle';
import { useIsMobile } from '../../hooks/useMediaQuery';
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
  ReceiptText,
  UtensilsCrossed,
  CreditCard,
  RefreshCcw,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

const MUTABLE_COMMANDE_PRIORITY: Record<string, number> = {
  'EN_COURS': 0,
  'EN_CUISINE': 1,
  'PRETE': 2,
  'PAYEE': 3,
  'ANNULEE': 4,
};

const selectCurrentCommande = (commandes: Commande[]) => {
  if (!commandes || commandes.length === 0) return null;
  return [...commandes].sort((left, right) => {
    const priorityDiff = (MUTABLE_COMMANDE_PRIORITY[left.statut] ?? 99) - (MUTABLE_COMMANDE_PRIORITY[right.statut] ?? 99);
    if (priorityDiff !== 0) return priorityDiff;
    return right.id - left.id; // Most recent if same priority
  })[0];
};

export const OrderingPage: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [table, setTable] = useState<Table | null>(null);
  const [currentCommande, setCurrentCommande] = useState<Commande | null>(null);
  
  const [cart, setCart] = useState<{ plat: Plat; quantite: number; notes: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
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
      if (sortedCats.length > 0 && activeCat === null) setActiveCat(sortedCats[0].id);
      
      const currentTable = tablesRes.data.find(t => t.id === Number(tableId));
      setTable(currentTable || null);
      
      const activeCmd = selectCurrentCommande(cmdRes.data);
      setCurrentCommande(activeCmd);
      
      if (activeCmd && activeCmd.lignes.length > 0 && !silent) {
          toast.success(`Commande active trouvée (#${activeCmd.id})`);
      }
    } catch (err) {
      console.error('Failed to load ordering data', err);
      toast.error('Erreur de chargement');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
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
  const existingTotal = currentCommande ? parseFloat(currentCommande.montant_total) : 0;
  const grandTotal = cartTotal + existingTotal;

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
        if (currentCommande.statut === 'EN_COURS') {
          await salleApi.updateCommandeStatut(currentCommande.id, 'EN_CUISINE');
        }
        toast.success('Articles ajoutés avec succès');
        setCart([]);
        await fetchData(true);
      } else {
        const orderRes = await salleApi.createCommande({
          table: Number(tableId),
          type: 'SUR_PLACE',
          lignes: lignes
        });
        await salleApi.updateCommandeStatut(orderRes.data.id, 'EN_CUISINE');
        toast.success('Commande créée et envoyée en cuisine');
        navigate('/salle');
      }
    } catch (err) {
      console.error('Failed to submit order', err);
      toast.error('Échec de l\'envoi');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePay = async () => {
    if (!currentCommande) return;
    if (cart.length > 0) {
      toast.error('Veuillez d\'abord envoyer ou supprimer les nouveaux articles');
      return;
    }

    setIsPaying(true);
    try {
      await salleApi.updateCommandeStatut(currentCommande.id, 'PAYEE');
      toast.success('Commande encaissée. Table libérée.');
      navigate('/salle');
    } catch (err) {
      console.error('Failed to pay order', err);
      toast.error('Erreur lors de l\'encaissement');
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-surface-main gap-6">
      <Loader2 className="w-16 h-16 animate-spin text-primary" strokeWidth={2.5}/>
      <p className="font-sans text-xs font-black uppercase tracking-[0.4em] text-on-surface-variant animate-pulse">Initialisation Système...</p>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-surface-main p-0 selection:bg-primary/20 selection:text-primary font-body overflow-hidden">
      
      {/* Dynamic Header */}
      <header className="flex-none flex items-center justify-between border-b border-outline-variant bg-surface-main px-4 md:px-staff-margin py-unit-sm h-20">
        <div className="flex items-center gap-3 md:gap-6">
          <button onClick={() => navigate('/salle')} className="p-2.5 rounded-xl hover:bg-surface-container-high transition-all text-on-surface-variant border border-transparent hover:border-outline-variant">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2">
                <div className="font-serif text-xl md:text-2xl font-black text-on-surface tracking-tighter uppercase italic">
                    Table {table?.numero || '??'}
                </div>
                {currentCommande && (
                   <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-sans text-[9px] font-black uppercase tracking-widest">Active</span>
                )}
            </div>
            <p className="font-sans text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest mt-0.5">Capacité: {table?.capacite || 0} Pers.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative group hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary" />
            <input 
              type="text"
              placeholder="SEARCH..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-32 md:w-64 h-12 bg-surface-container-low border border-outline-variant pl-10 pr-4 rounded-xl font-sans text-xs font-bold text-on-surface focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/20"
            />
          </div>
          
          <button 
            onClick={() => fetchData(true)} 
            className="p-3 rounded-xl bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-highest transition-all"
            title="Refresh Order"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>

          {isMobile && (
            <button 
              onClick={() => setShowCart(!showCart)}
              className={`p-3 rounded-xl relative transition-all border ${showCart ? 'bg-primary border-primary text-on-primary shadow-lg shadow-primary/30' : 'bg-surface-container border-outline-variant text-on-surface-variant'}`}
            >
              {showCart ? <UtensilsCrossed className="w-6 h-6" /> : <ReceiptText className="w-6 h-6" />}
              {(cart.length > 0 || (currentCommande?.lignes.length || 0) > 0) && !showCart && (
                <span className="absolute -top-1.5 -right-1.5 bg-error text-on-error text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface-main">
                  {cart.length + (currentCommande?.lignes.length || 0)}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Menu Panel */}
        <section 
          data-testid="menu-catalog" 
          className={`
            flex-[7] h-full border-r border-outline-variant bg-surface-container-lowest flex flex-col min-w-0 transition-all duration-500 ease-out
            ${isMobile && showCart ? 'translate-x-[-20%] absolute inset-0 z-0 opacity-0 pointer-events-none' : 'translate-x-0 relative z-10'}
          `}
        >
          {/* Categories Nav */}
          <div className="flex-none flex overflow-x-auto border-b border-outline-variant bg-surface-main py-3 px-4 md:px-staff-gutter gap-3 custom-scrollbar">
            <button
                onClick={() => setActiveCat(null)}
                className={`px-5 py-2.5 rounded-lg font-sans text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border-2 ${activeCat === null ? 'bg-primary border-primary text-on-primary shadow-xl shadow-primary/20' : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-primary/40'}`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`px-5 py-2.5 rounded-lg font-sans text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border-2 ${activeCat === cat.id ? 'bg-primary border-primary text-on-primary shadow-xl shadow-primary/20' : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-primary/40'}`}
              >
                {cat.nom}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4 md:p-staff-margin grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max custom-scrollbar bg-[radial-gradient(circle_at_top_right,#fdfaf8,transparent)]">
            {filteredPlats.map(plat => (
              <button
                key={plat.id}
                onClick={() => {
                  addToCart(plat);
                  if (isMobile) {
                    toast.success(`${plat.nom} +1`, { duration: 800, position: 'bottom-center' });
                  }
                }}
                className={`
                  group bg-surface-main border-2 border-outline-variant/60 rounded-2xl p-4 text-left flex flex-col justify-between h-40 transition-all relative overflow-hidden
                  hover:border-primary hover:shadow-2xl hover:shadow-primary/10 active:scale-[0.96]
                  ${!plat.est_disponible ? 'opacity-40 grayscale cursor-not-allowed' : ''}
                `}
                disabled={!plat.est_disponible}
              >
                <div className="flex flex-col gap-1.5">
                  <span className="font-body text-[16px] font-bold text-on-surface leading-tight line-clamp-2 uppercase tracking-tight">{plat.nom}</span>
                  <span className="font-sans text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest">
                    {categories.find(c => c.id === plat.categorie)?.nom}
                  </span>
                </div>
                <div className="flex items-end justify-between mt-auto">
                  <span className="font-sans text-[18px] font-black text-primary tabular-nums">{parseFloat(plat.prix).toFixed(0)} DH</span>
                  <div className="size-8 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all shadow-sm">
                    <Plus className="w-4 h-4 text-on-surface group-hover:text-on-primary" />
                  </div>
                </div>
                {!plat.est_disponible && (
                   <span className="absolute top-3 right-3 px-2 py-1 bg-error text-on-error font-sans text-[8px] font-black uppercase tracking-tighter rounded-md">SOLD OUT</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Ticket Panel */}
        <section 
          data-testid="ordering-cart" 
          className={`
            flex-[3] h-full bg-surface-main flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.05)] z-20 transition-all duration-500 ease-out
            ${isMobile ? (showCart ? 'w-full translate-x-0 relative' : 'w-full translate-x-[100%] absolute inset-0 opacity-0 pointer-events-none') : 'min-w-[380px] translate-x-0 relative'}
          `}
        >
          {/* Ticket Header */}
          <div className="px-8 py-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low h-20 shrink-0">
            <div className="flex items-center gap-3">
               <ReceiptText className="w-5 h-5 text-primary" />
               <span className="font-sans text-[13px] font-black text-on-surface-variant uppercase tracking-[0.25em]">Ticket Actuel</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-outline-variant/40 shadow-inner">
               <span className="font-sans text-[12px] font-bold text-primary tabular-nums">{cart.length + (currentCommande?.lignes.length || 0)}</span>
               <span className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Pcs</span>
            </div>
          </div>

          {/* Items Scroll Area */}
          <div className="flex-1 overflow-y-auto bg-surface-main custom-scrollbar">
            {cart.length === 0 && (!currentCommande || currentCommande.lignes.length === 0) ? (
               <div data-testid="cart-empty" className="h-full flex flex-col items-center justify-center p-12 opacity-10">
                  <UtensilsCrossed className="w-16 h-16 stroke-[0.5] text-primary" />
                  <p className="font-sans text-[11px] font-black uppercase tracking-[0.5em] mt-6 text-center">Ticket Vide</p>
               </div>
            ) : (
              <div className="flex flex-col">
                {/* Section Commandée (Serveur/Cuisine) */}
                {currentCommande && currentCommande.lignes.length > 0 && (
                  <div className="flex flex-col border-b border-outline-variant">
                    <div className="px-8 py-3 bg-surface-container-low/50 flex items-center justify-between">
                       <span className="font-sans text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Articles en cours</span>
                       <span className="font-sans text-[10px] font-bold text-primary italic uppercase tracking-tighter">Status: {currentCommande.statut}</span>
                    </div>
                    {currentCommande.lignes.map((ligne) => (
                      <div key={ligne.id} className="px-8 py-5 border-b border-outline-variant/30 bg-surface-container-lowest/30 flex justify-between items-start group">
                        <div className="flex gap-4 min-w-0 flex-1">
                          <div className="h-10 w-10 rounded-xl bg-surface-container flex items-center justify-center font-sans text-sm font-black text-on-surface-variant/40 tabular-nums">
                            {ligne.quantite}x
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <p className="font-body text-[15px] font-bold text-on-surface-variant/80 truncate uppercase tracking-tight">{ligne.plat_nom || 'Item'}</p>
                            <div className="flex items-center gap-2.5 mt-1.5">
                               <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full font-sans text-[8px] font-black uppercase tracking-widest border transition-colors ${
                                 ligne.statut === 'SERVI' ? 'bg-success/5 text-success border-success/20' : 
                                 ligne.statut === 'PRET' ? 'bg-primary/5 text-primary border-primary/20 animate-pulse' : 
                                 'bg-surface-container text-on-surface-variant/60 border-outline-variant/30'
                               }`}>
                                 {ligne.statut === 'PRET' && <CheckCircle2 className="w-2.5 h-2.5" />}
                                 {ligne.statut === 'EN_PREPARATION' && <Clock className="w-2.5 h-2.5 animate-spin" />}
                                 {ligne.statut}
                               </div>
                            </div>
                          </div>
                        </div>
                        <span className="font-sans text-[15px] font-black text-on-surface-variant/50 tabular-nums mt-1">{(parseFloat(ligne.prix_unitaire) * ligne.quantite).toFixed(0)} DH</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Section Nouveau Panier */}
                {cart.length > 0 && (
                  <div className="flex flex-col">
                    <div className="px-8 py-3 bg-primary/5 flex items-center gap-2">
                       <Plus className="w-3 h-3 text-primary" />
                       <span className="font-sans text-[10px] font-black uppercase tracking-widest text-primary">Nouveaux Articles</span>
                    </div>
                    {cart.map((item, idx) => (
                      <div key={`${item.plat.id}-${idx}`} data-testid={`cart-item-${item.plat.id}`} className="px-8 py-5 border-b border-outline-variant hover:bg-surface-container-low transition-all group bg-primary/[0.02]">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4 min-w-0 flex-1">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-sans text-sm font-black text-primary tabular-nums">
                               {item.quantite}x
                            </div>
                            <div className="flex-1 min-w-0 py-0.5">
                              <p className="font-body text-[15px] font-bold text-on-surface truncate uppercase tracking-tight">{item.plat.nom}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <button onClick={() => updateQty(item.plat.id, -1)} className="p-1.5 rounded-lg bg-surface-container border border-outline-variant hover:bg-primary hover:text-on-primary transition-all">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-sans text-xs font-black text-on-surface tabular-nums">{item.quantite}</span>
                                <button onClick={() => addToCart(item.plat)} className="p-1.5 rounded-lg bg-surface-container border border-outline-variant hover:bg-primary hover:text-on-primary transition-all">
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3 shrink-0 py-0.5">
                            <span className="font-sans text-[16px] font-black text-primary tabular-nums">{(parseFloat(item.plat.prix) * item.quantite).toFixed(0)} DH</span>
                            <button onClick={() => removeFromCart(item.plat.id)} className="p-2 rounded-lg bg-error/5 text-error/30 hover:bg-error/10 hover:text-error transition-all opacity-0 group-hover:opacity-100">
                                <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Recap & Actions */}
          <div className="flex-none border-t-2 border-outline-variant bg-surface-container-low p-8 flex flex-col gap-6 shadow-[0_-20px_40px_rgba(0,0,0,0.08)]">
            <div className="space-y-3">
              <div className="flex justify-between items-center font-sans text-[12px] font-black text-on-surface-variant/40 uppercase tracking-widest">
                <span>Déjà Commandé</span>
                <span className="tabular-nums">{existingTotal.toFixed(0)} DH</span>
              </div>
              <div className="flex justify-between items-center font-sans text-[12px] font-black text-primary uppercase tracking-widest">
                <span>En attente d'envoi</span>
                <span className="tabular-nums">{cartTotal.toFixed(0)} DH</span>
              </div>
              <div className="pt-4 border-t border-outline-variant border-dashed flex justify-between items-center">
                <span className="font-serif text-2xl font-black text-on-surface italic tracking-tight uppercase">Total Addition</span>
                <div className="flex flex-col items-end">
                   <span className="font-sans text-3xl font-black text-primary tabular-nums">{grandTotal.toFixed(0)} DH</span>
                   <span className="font-sans text-[9px] font-black text-on-surface-variant/30 uppercase tracking-tighter">Taxes & Service Inclus</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {cart.length > 0 && (
                <button 
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-2xl bg-primary text-on-primary font-sans text-xs font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] border-2 border-primary"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Envoyer en Cuisine</span>
                    </>
                  )}
                </button>
              )}

              {currentCommande && cart.length === 0 && (
                <button 
                  onClick={handlePay}
                  disabled={isPaying}
                  className="w-full h-16 rounded-2xl bg-success text-on-success font-sans text-xs font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-success/30 hover:scale-[1.02] active:scale-[0.98] border-2 border-success"
                >
                  {isPaying ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Lancer l'Encaissement</span>
                    </>
                  )}
                </button>
              )}
              
              {currentCommande && cart.length > 0 && (
                 <p className="font-sans text-[10px] font-bold text-on-surface-variant/40 text-center uppercase tracking-widest">Veuillez envoyer la suite pour encaisser</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Mobile Sticky Bar */}
      {isMobile && !showCart && (cart.length > 0 || (currentCommande?.lignes.length || 0) > 0) && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-4rem)] max-w-md">
           <button 
             onClick={() => setShowCart(true)}
             className="w-full h-16 bg-[#0d0b0a] text-primary rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between px-8 font-sans text-[12px] font-black uppercase tracking-[0.25em] animate-in slide-in-from-bottom-20 fade-in duration-700 border border-primary/20"
           >
             <span className="flex items-center gap-4">
               <ReceiptText className="w-5 h-5" />
               Voir Ticket ({cart.length + (currentCommande?.lignes.length || 0)})
             </span>
             <div className="flex items-center gap-3">
                <span className="bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 tabular-nums">{grandTotal.toFixed(0)} DH</span>
                <ChevronRight className="w-4 h-4 opacity-40" />
             </div>
           </button>
        </div>
      )}
    </div>
  );
};
