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
  ChevronRight,
  AlertCircle,
  Hash
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
  if (!commandes || !Array.isArray(commandes) || commandes.length === 0) return null;
  return [...commandes].sort((left, right) => {
    const priorityDiff = (MUTABLE_COMMANDE_PRIORITY[left.statut] ?? 99) - (MUTABLE_COMMANDE_PRIORITY[right.statut] ?? 99);
    if (priorityDiff !== 0) return priorityDiff;
    return right.id - left.id;
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
        salleApi.getCommandes({ table: tableId })
      ]);

      const sortedCats = catsRes.data.filter(c => c.est_active).sort((a, b) => a.ordre_affichage - b.ordre_affichage);
      setCategories(sortedCats);
      setPlats(platsRes.data.filter(p => p.est_active && p.est_disponible));
      if (sortedCats.length > 0 && activeCat === null) setActiveCat(sortedCats[0].id);
      
      const currentTable = tablesRes.data.find(t => t.id === Number(tableId));
      setTable(currentTable || null);
      
      const activeCommands = cmdRes.data.filter(cmd => !['PAYEE', 'ANNULEE'].includes(cmd.statut));
      const activeCmd = selectCurrentCommande(activeCommands);
      setCurrentCommande(activeCmd);
      
      if (activeCmd && !silent) {
          toast.success(`Commande #${activeCmd.id} active`);
      }
    } catch (err) {
      console.error('Failed to load ordering data', err);
      toast.error('Erreur technique');
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
        return prev.map(item => item.plat.id === plat.id ? { ...item, quantite: item.quantite + 1 } : item);
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
        // Now using flexible backend action that accepts either format
        await salleApi.addItemsToCommande(currentCommande.id, lignes);
        if (currentCommande.statut === 'EN_COURS') {
          await salleApi.updateCommandeStatut(currentCommande.id, 'EN_CUISINE');
        }
        toast.success('Articles ajoutés');
        setCart([]);
        await fetchData(true);
      } else {
        const orderRes = await salleApi.createCommande({
          table: Number(tableId),
          type: 'SUR_PLACE',
          lignes: lignes
        });
        await salleApi.updateCommandeStatut(orderRes.data.id, 'EN_CUISINE');
        toast.success('Commande créée');
        navigate('/salle');
      }
    } catch (err) {
      console.error('Failed to submit order', err);
      toast.error('Erreur d\'envoi');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePay = async () => {
    if (!currentCommande) return;
    setIsPaying(true);
    try {
      await salleApi.updateCommandeStatut(currentCommande.id, 'PAYEE');
      toast.success('Addition encaissée');
      navigate('/salle');
    } catch (err) {
      console.error('Failed to pay order', err);
      toast.error('Erreur de paiement');
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-surface-main z-50">
      <Loader2 className="w-12 h-12 animate-spin text-primary" strokeWidth={3}/>
      <p className="font-sans text-[10px] font-black uppercase tracking-[0.5em] text-[#301400] mt-8">Connexion Serveur...</p>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-surface-main p-0 selection:bg-primary/20 selection:text-primary font-body overflow-hidden">
      
      {/* High-Contrast Header */}
      <header className="flex-none flex items-center justify-between border-b-2 border-outline-variant bg-surface-main px-4 md:px-staff-margin h-20 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/salle')} className="p-3 rounded-2xl bg-surface-container border border-outline-variant text-[#301400]">
            <ArrowLeft className="w-6 h-6" strokeWidth={3} />
          </button>
          <div>
            <div className="flex items-center gap-3">
                <div className="font-serif text-2xl font-black text-[#301400] tracking-tighter uppercase italic">
                    Table {table?.numero || '??'}
                </div>
                {currentCommande && (
                   <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary font-sans text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                     <Hash className="w-3 h-3" /> {currentCommande.id}
                   </div>
                )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => fetchData(true)} className="p-3 rounded-2xl bg-surface-container border-2 border-outline-variant text-[#301400] hover:bg-primary hover:text-on-primary hover:border-primary transition-all active:scale-90">
            <RefreshCcw className="w-6 h-6" strokeWidth={2.5} />
          </button>

          {isMobile && (
            <button 
              onClick={() => setShowCart(!showCart)}
              className={`p-3 rounded-2xl relative transition-all border-2 ${showCart ? 'bg-primary border-primary text-on-primary shadow-xl shadow-primary/40' : 'bg-surface-container border-outline-variant text-[#301400]'}`}
            >
              {showCart ? <UtensilsCrossed className="w-7 h-7" strokeWidth={2.5} /> : <ReceiptText className="w-7 h-7" strokeWidth={2.5} />}
              {(cart.length > 0 || (currentCommande?.lignes?.length || 0) > 0) && !showCart && (
                <span className="absolute -top-2 -right-2 bg-error text-on-error text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-surface-main shadow-lg">
                  {cart.length + (currentCommande?.lignes?.length || 0)}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Menu Section */}
        <section 
          className={`
            flex-[7] h-full border-r-2 border-outline-variant bg-surface-container-lowest flex flex-col min-w-0 transition-all duration-500
            ${isMobile && showCart ? 'translate-x-[-100%] absolute inset-0 z-0 opacity-0 pointer-events-none' : 'translate-x-0 relative z-10'}
          `}
        >
          <div className="flex-none flex overflow-x-auto border-b-2 border-outline-variant bg-surface-main py-4 px-4 md:px-staff-gutter gap-3 custom-scrollbar">
            <button onClick={() => setActiveCat(null)} className={`px-6 py-3 rounded-xl font-sans text-[12px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${activeCat === null ? 'bg-[#301400] text-white border-[#301400] shadow-xl' : 'bg-surface-container border-outline-variant text-[#301400]'}`}>Tous</button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCat(cat.id)} className={`px-6 py-3 rounded-xl font-sans text-[12px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${activeCat === cat.id ? 'bg-[#301400] text-white border-[#301400] shadow-xl' : 'bg-surface-container border-outline-variant text-[#301400]'}`}>{cat.nom}</button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max custom-scrollbar">
            {filteredPlats.map(plat => (
              <button
                key={plat.id}
                onClick={() => { addToCart(plat); if (isMobile) toast.success(`${plat.nom} +1`, { position: 'bottom-center' }); }}
                className={`group bg-surface-main border-2 border-outline-variant rounded-3xl p-5 text-left flex flex-col justify-between h-48 transition-all hover:border-primary hover:shadow-2xl active:scale-[0.95] ${!plat.est_disponible ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                disabled={!plat.est_disponible}
              >
                <div className="flex flex-col gap-2">
                  <span className="font-body text-[17px] font-black text-[#301400] leading-tight line-clamp-2 uppercase">{plat.nom}</span>
                  <span className="font-sans text-[10px] font-black text-[#301400]/40 uppercase tracking-widest">{categories.find(c => c.id === plat.categorie)?.nom}</span>
                </div>
                <div className="flex items-end justify-between mt-auto">
                  <span className="font-sans text-[20px] font-black text-primary tabular-nums">{parseFloat(plat.prix).toFixed(0)} DH</span>
                  <div className="size-12 rounded-2xl bg-surface-container border-2 border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                    <Plus className="w-6 h-6 text-[#301400] group-hover:text-on-primary" strokeWidth={3} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Ticket Section */}
        <section 
          className={`
            flex-[3] h-full bg-surface-main flex flex-col shadow-[-40px_0_80px_rgba(0,0,0,0.08)] z-20 transition-all duration-500
            ${isMobile ? (showCart ? 'w-full translate-x-0 relative' : 'w-full translate-x-[100%] absolute inset-0 opacity-0 pointer-events-none') : 'min-w-[450px] translate-x-0 relative'}
          `}
        >
          <div className="px-8 py-6 border-b-2 border-outline-variant flex justify-between items-center bg-surface-container-low h-24 shrink-0">
            <div className="flex items-center gap-4">
               <ReceiptText className="w-8 h-8 text-primary" strokeWidth={2.5} />
               <span className="font-sans text-[16px] font-black text-[#301400] uppercase tracking-[0.3em]">Ticket Actuel</span>
            </div>
            <div className="bg-[#301400] text-white px-4 py-2 rounded-2xl font-sans text-[14px] font-black tabular-nums shadow-lg">
               {cart.length + (currentCommande?.lignes?.length || 0)} <span className="text-[10px] opacity-60 ml-1">PCS</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-surface-main custom-scrollbar">
            {cart.length === 0 && (!currentCommande || !currentCommande.lignes || currentCommande.lignes.length === 0) ? (
               <div className="h-full flex flex-col items-center justify-center p-16">
                  <UtensilsCrossed className="w-24 h-24 stroke-[0.5] text-[#301400]/10" />
                  <p className="font-sans text-[12px] font-black uppercase tracking-[0.6em] mt-10 text-[#301400]/20 text-center">Aucun article enregistré</p>
               </div>
            ) : (
              <div className="flex flex-col">
                {/* Existing Items - ULTRA HIGH CONTRAST */}
                {currentCommande && currentCommande.lignes && currentCommande.lignes.length > 0 && (
                  <div className="flex flex-col">
                    <div className="px-8 py-4 bg-[#301400]/5 border-b-2 border-outline-variant flex items-center justify-between">
                       <span className="font-sans text-[11px] font-black uppercase tracking-widest text-[#301400]">Enregistré en cuisine</span>
                       <span className="font-sans text-[10px] font-bold text-primary uppercase">ID: #{currentCommande.id}</span>
                    </div>
                    {currentCommande.lignes.map((ligne) => (
                      <div key={ligne.id || `l-${ligne.id}`} className="px-8 py-6 border-b-2 border-outline-variant/30 flex justify-between items-start bg-white">
                        <div className="flex gap-5 min-w-0 flex-1">
                          <div className="h-12 w-12 rounded-2xl bg-surface-container flex items-center justify-center font-sans text-lg font-black text-[#301400] border-2 border-outline-variant/50">
                            {ligne.quantite}x
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <p className="font-body text-[17px] font-black text-[#301400] truncate uppercase tracking-tight">{ligne.plat_nom || 'Item'}</p>
                            <div className="flex items-center gap-3 mt-2">
                               <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-sans text-[10px] font-black uppercase tracking-widest border-2 ${
                                 ligne.statut === 'SERVI' ? 'bg-success text-on-success border-success' : 
                                 ligne.statut === 'PRET' ? 'bg-primary text-on-primary border-primary animate-pulse' : 
                                 'bg-surface-container-high text-[#301400] border-outline-variant'
                               }`}>
                                 {ligne.statut}
                               </div>
                            </div>
                          </div>
                        </div>
                        <span className="font-sans text-[18px] font-black text-[#301400] mt-1">{(parseFloat(ligne.prix_unitaire) * ligne.quantite).toFixed(0)} DH</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Items */}
                {cart.length > 0 && (
                  <div className="flex flex-col">
                    <div className="px-8 py-4 bg-primary/10 border-b-2 border-primary/20 flex items-center gap-3">
                       <Plus className="w-5 h-5 text-primary" strokeWidth={3} />
                       <span className="font-sans text-[11px] font-black uppercase tracking-widest text-primary">À Envoyer (Nouveau)</span>
                    </div>
                    {cart.map((item, idx) => (
                      <div key={`new-${idx}`} className="px-8 py-7 border-b-2 border-outline-variant hover:bg-primary/5 transition-all group bg-primary/[0.03]">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-5 min-w-0 flex-1">
                            <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center font-sans text-xl font-black text-primary border-2 border-primary/30">
                               {item.quantite}x
                            </div>
                            <div className="flex-1 min-w-0 py-1">
                              <p className="font-body text-[18px] font-black text-[#301400] truncate uppercase tracking-tight">{item.plat.nom}</p>
                              <div className="flex items-center gap-6 mt-4">
                                <button onClick={() => updateQty(item.plat.id, -1)} className="p-2.5 rounded-xl bg-white border-2 border-[#301400] text-[#301400] hover:bg-[#301400] hover:text-white transition-all shadow-md"><Minus className="w-5 h-5" strokeWidth={4} /></button>
                                <span className="font-sans text-lg font-black text-[#301400] tabular-nums">{item.quantite}</span>
                                <button onClick={() => addToCart(item.plat)} className="p-2.5 rounded-xl bg-white border-2 border-[#301400] text-[#301400] hover:bg-[#301400] hover:text-white transition-all shadow-md"><Plus className="w-5 h-5" strokeWidth={4} /></button>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-5 shrink-0 py-1">
                            <span className="font-sans text-[20px] font-black text-primary tabular-nums">{(parseFloat(item.plat.prix) * item.quantite).toFixed(0)} DH</span>
                            <button onClick={() => removeFromCart(item.plat.id)} className="p-3 rounded-2xl bg-error/10 text-error hover:bg-error hover:text-on-error transition-all shadow-lg"><Trash2 className="w-6 h-6" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-none border-t-4 border-[#301400] bg-surface-container-low p-8 flex flex-col gap-8 shadow-[0_-40px_80px_rgba(0,0,0,0.15)] z-30">
            <div className="space-y-4">
              <div className="flex justify-between items-center font-sans text-[14px] font-black text-[#301400]/40 uppercase tracking-widest">
                <span>Déjà Commandé</span>
                <span className="tabular-nums">{existingTotal.toFixed(0)} DH</span>
              </div>
              <div className="flex justify-between items-center font-sans text-[14px] font-black text-primary uppercase tracking-widest">
                <span>En attente</span>
                <span className="tabular-nums">{cartTotal.toFixed(0)} DH</span>
              </div>
              <div className="pt-6 border-t-4 border-[#301400] border-double flex justify-between items-center">
                <span className="font-serif text-3xl font-black text-[#301400] italic uppercase tracking-tighter">Total</span>
                <span className="font-sans text-5xl font-black text-[#301400] tabular-nums tracking-tighter">{grandTotal.toFixed(0)} <span className="text-xl">DH</span></span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {cart.length > 0 ? (
                <button onClick={handleSubmitOrder} disabled={isSubmitting} className="w-full h-20 rounded-3xl bg-[#301400] text-white font-sans text-sm font-black uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-4 shadow-2xl hover:scale-[1.02] active:scale-[0.98] border-4 border-[#301400]">
                  {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : <><Send className="w-7 h-7" strokeWidth={3} /><span>Envoyer Cuisine</span></>}
                </button>
              ) : (
                currentCommande && (
                  <button onClick={handlePay} disabled={isPaying} className="w-full h-20 rounded-3xl bg-success text-on-success font-sans text-sm font-black uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-4 shadow-2xl hover:scale-[1.02] active:scale-[0.98] border-4 border-success">
                    {isPaying ? <Loader2 className="w-8 h-8 animate-spin" /> : <><CreditCard className="w-7 h-7" strokeWidth={3} /><span>Encaisser {grandTotal.toFixed(0)} DH</span></>}
                  </button>
                )
              )}
              {currentCommande && cart.length > 0 && (
                 <div className="flex items-center justify-center gap-3 py-3 px-5 rounded-2xl bg-error/10 border-2 border-error/20">
                    <AlertCircle className="w-5 h-5 text-error" />
                    <p className="font-sans text-[11px] font-black text-error uppercase tracking-widest">Articles en attente d'envoi</p>
                 </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Mobile Floating Bar */}
      {isMobile && !showCart && (cart.length > 0 || (currentCommande?.lignes?.length || 0) > 0) && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-4rem)] max-w-md">
           <button 
             onClick={() => setShowCart(true)}
             className="w-full h-20 bg-[#301400] text-white rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.6)] flex items-center justify-between px-10 font-sans text-[14px] font-black uppercase tracking-[0.3em] animate-in slide-in-from-bottom-20 fade-in duration-700"
           >
             <span className="flex items-center gap-5">
               <ReceiptText className="w-8 h-8" strokeWidth={2.5} />
               <span>TICKET</span>
             </span>
             <div className="flex items-center gap-5">
                <span className="bg-white/10 px-6 py-2 rounded-2xl border border-white/20 tabular-nums text-lg">{grandTotal.toFixed(0)} DH</span>
                <ChevronRight className="w-6 h-6 opacity-40" />
             </div>
           </button>
        </div>
      )}
    </div>
  );
};
