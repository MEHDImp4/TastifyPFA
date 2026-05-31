import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { salleApi } from '../../api/salle';
import { menuApi } from '../../api/menu';
import { useIsMobile } from '../../hooks/useMediaQuery';
import type { Table, Commande } from '../../types/salle';
import type { Plat, Categorie } from '../../types/menu';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2, 
  Loader2, 
  Send, 
  ShoppingCart,
  X,
  CreditCard,
  Banknote,
  QrCode,
  ExternalLink,
  ChevronRight,
  RefreshCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Hash,
  UtensilsCrossed,
  ReceiptText,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

// --- Constants ---
const MUTABLE_COMMANDE_PRIORITY: Record<string, number> = {
  'EN_COURS': 0,
  'EN_CUISINE': 1,
  'PRETE': 2,
  'PAYEE': 3,
  'ANNULEE': 4,
};

const selectCurrentCommande = (commandes: Commande[]): Commande | null => {
    if (!commandes || !Array.isArray(commandes) || commandes.length === 0) return null;
    return [...commandes].sort((left, right) => {
      const priorityDiff = (MUTABLE_COMMANDE_PRIORITY[left.statut] ?? 99) - (MUTABLE_COMMANDE_PRIORITY[right.statut] ?? 99);
      if (priorityDiff !== 0) return priorityDiff;
      return right.id - left.id;
    })[0] ?? null;
};

export const OrderingPage: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [table, setTable] = useState<Table | null>(null);
  const [currentCommande, setCurrentCommande] = useState<Commande | null>(null);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  
  const [cart, setCart] = useState<{ plat: Plat; quantite: number; notes: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showCart, setShowCart] = useState(false);

  // Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'CHOICE' | 'QR'>('CHOICE');
  const [qrData, setQrData] = useState<{ token: string, url: string } | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [tablesRes, cmdRes, platsRes, catsRes] = await Promise.all([
        salleApi.getTables(),
        salleApi.getCommandes({ table: tableId }),
        menuApi.getPlats(),
        menuApi.getCategories()
      ]);

      const currentTable = tablesRes.data.find(t => t.id === Number(tableId));
      setTable(currentTable || null);

      const activeCommands = cmdRes.data.filter(cmd => !['PAYEE', 'ANNULEE'].includes(cmd.statut));
      const activeCmd = selectCurrentCommande(activeCommands);
      setCurrentCommande(activeCmd);
      
      setPlats(platsRes.data.filter(p => p.est_active && p.est_disponible));
      const sortedCats = catsRes.data.filter(c => c.est_active).sort((a, b) => a.ordre_affichage - b.ordre_affichage);
      setCategories(sortedCats);
      
      if (!activeCat && sortedCats.length > 0) {
          setActiveCat(sortedCats[0].id);
      }
      
      if (activeCmd && !silent) {
          toast.success(`Commande active (#${activeCmd.id}) chargée`);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableId]);

  const addToCart = (plat: Plat) => {
    setCart(prev => {
      const existing = prev.find(item => item.plat.id === plat.id);
      if (existing) {
        return prev.map(item => item.plat.id === plat.id ? { ...item, quantite: item.quantite + 1 } : item);
      }
      return [...prev, { plat, quantite: 1, notes: '' }];
    });
  };

  const updateCartQty = (platId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.plat.id === platId) {
        const newQty = Math.max(1, item.quantite + delta);
        return { ...item, quantite: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (platId: number) => {
    setCart(prev => prev.filter(item => item.plat.id !== platId));
  };

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
        toast.success('Articles envoyés');
        setCart([]);
        await fetchData(true);
        navigate('/salle');
      } else {
        const orderRes = await salleApi.createCommande({
          table: Number(tableId),
          type: 'SUR_PLACE',
          lignes: lignes as any
        });
        await salleApi.updateCommandeStatut(orderRes.data.id, 'EN_CUISINE');
        toast.success('Commande validée');
        navigate('/salle');
      }
    } catch (err) {
      console.error('Failed to submit order', err);
      toast.error('Échec d\'envoi');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Payment Handlers ---
  const handleOpenPayModal = () => {
    if (!currentCommande) return;
    setPaymentStep('CHOICE');
    setIsPayModalOpen(true);
  };

  const handleManualPay = async (methode: 'CASH' | 'CARD') => {
    if (!currentCommande) return;
    setIsPaying(true);
    try {
        await salleApi.createManualPayment({
            commande: currentCommande.id,
            montant: currentCommande.montant_total,
            methode
        });
        toast.success(`Paiement ${methode === 'CASH' ? 'Espèces' : 'Carte'} validé`);
        setIsPayModalOpen(false);
        navigate('/salle');
    } catch (err) {
        toast.error('Échec de l\'encaissement');
    } finally {
        setIsPaying(false);
    }
  };

  const handleGenerateQr = async () => {
    if (!table) return;
    setIsPaying(true);
    try {
        const res = await salleApi.getPaymentQr(table.id);
        setQrData({ token: res.data.token, url: res.data.payment_url });
        setPaymentStep('QR');
    } catch (err) {
        toast.error('Échec de génération du QR');
    } finally {
        setIsPaying(false);
    }
  };

  const filteredPlats = plats.filter(p => 
    (activeCat === null || p.categorie === activeCat) &&
    (search === '' || p.nom.toLowerCase().includes(search.toLowerCase()))
  );

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.plat.prix) * item.quantite), 0);
  const existingTotal = currentCommande ? parseFloat(currentCommande.montant_total) : 0;
  const grandTotal = cartTotal + existingTotal;

  if (isLoading) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
      <Loader2 className="w-12 h-12 animate-spin text-primary" strokeWidth={3}/>
      <p className="font-sans text-[10px] font-black uppercase tracking-[0.5em] text-primary mt-8 animate-pulse">Chargement...</p>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-background p-0 selection:bg-primary/20 selection:text-primary font-body overflow-hidden text-on-background">
      
      {/* Tactical Header */}
      <header className="flex-none h-20 bg-surface-container-lowest border-b border-outline-variant px-4 md:px-staff-margin flex items-center justify-between z-30">
        <div className="flex items-center gap-4 md:gap-8">
          <button onClick={() => navigate('/salle')} className="w-12 h-12 rounded-xl bg-surface-container-low border border-outline-variant hover:text-primary transition-all flex items-center justify-center">
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-primary  leading-none">Table {table?.numero}</h1>
               {currentCommande && (
                   <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-sans text-[9px] font-black uppercase tracking-widest">
                     <Hash className="w-3 h-3" /> {currentCommande.id}
                   </div>
               )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <div className="relative group hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <input 
              type="text"
              placeholder="SEARCH MENU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 md:w-64 h-11 bg-surface-container border border-outline-variant/50 pl-10 pr-4 rounded-xl font-sans text-xs font-bold text-on-surface focus:border-primary outline-none transition-all placeholder:text-on-surface-variant"
            />
          </div>
          
           <button 
             onClick={handleOpenPayModal}
             disabled={!currentCommande || isPaying}
             className="h-12 md:h-14 px-6 md:px-8 bg-success text-on-success rounded-xl font-sans text-[10px] md:text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
           >
             Encaisser {currentCommande ? `${parseFloat(currentCommande.montant_total).toFixed(0)} DH` : ''}
           </button>
           
           <button onClick={() => fetchData(true)} className="p-3 rounded-xl bg-surface-container border border-outline-variant text-primary hover:bg-primary hover:text-on-primary transition-all">
            <RefreshCcw className="w-5 h-5" />
          </button>

          {isMobile && (
            <button 
              onClick={() => setShowCart(!showCart)}
              className={`p-3 rounded-xl relative transition-all border ${showCart ? 'bg-primary border-primary text-on-primary' : 'bg-surface-container border-outline-variant text-on-surface'}`}
            >
              {showCart ? <UtensilsCrossed className="w-6 h-6" /> : <ReceiptText className="w-6 h-6" />}
              {(cart.length > 0 || (currentCommande?.lignes?.length || 0) > 0) && !showCart && (
                <span className="absolute -top-1.5 -right-1.5 bg-error text-on-error text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-background">
                  {cart.length + (currentCommande?.lignes?.length || 0)}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* Left: Menu */}
        <section 
          data-testid="menu-catalog" 
          className={`
            flex-[7] flex flex-col min-w-0 border-r border-outline-variant bg-background transition-all duration-500 ease-in-out
            ${isMobile && showCart ? 'translate-x-[-100%] absolute inset-0 z-0 opacity-0 pointer-events-none' : 'translate-x-0 relative z-10'}
          `}
        >
          {/* Categories */}
          <div className="flex-none h-16 border-b border-outline-variant bg-surface-container-lowest flex gap-2.5 p-2 overflow-x-auto no-scrollbar">
            <button
                onClick={() => setActiveCat(null)}
                className={`px-6 rounded-lg font-sans text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeCat === null ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-primary/40'}`}
            >
              Tous
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`px-6 rounded-lg font-sans text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeCat === cat.id ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-primary/40'}`}
              >
                {cat.nom}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-background">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
               {filteredPlats.map(plat => (
                 <button
                   key={plat.id}
                   onClick={() => { addToCart(plat); if (isMobile) toast.success(`${plat.nom} +1`, { duration: 600, position: 'bottom-center' }); }}
                   className={`
                     group bg-surface-container border-2 border-outline-variant rounded-2xl p-4 md:p-6 text-left transition-all hover:border-primary hover:bg-surface-container-high active:scale-[0.96] relative overflow-hidden h-40 md:h-48
                     ${!plat.est_disponible ? 'opacity-40 grayscale cursor-not-allowed border-dashed' : ''}
                   `}
                   disabled={!plat.est_disponible}
                 >
                    <div className="flex flex-col gap-1">
                       <h3 className="font-serif text-base md:text-lg font-black text-on-surface uppercase tracking-tight leading-tight line-clamp-2 ">{plat.nom}</h3>
                       <span className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">
                         {categories.find(c => c.id === plat.categorie)?.nom}
                       </span>
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                       <span className="font-sans text-lg md:text-xl font-black text-primary tabular-nums">{parseFloat(plat.prix).toFixed(0)} DH</span>
                       <div className="size-10 rounded-xl bg-surface-container-lowest border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                          <Plus className="w-5 h-5 text-on-surface group-hover:text-on-primary" strokeWidth={4} />
                       </div>
                    </div>
                 </button>
               ))}
            </div>
          </div>
        </section>

        {/* Right: Ticket */}
        <section 
          data-testid="ordering-cart" 
          className={`
            flex-[3] flex flex-col bg-surface-container border-l border-outline-variant z-20 transition-all duration-500 ease-in-out
            ${isMobile ? (showCart ? 'w-full translate-x-0 relative' : 'w-full translate-x-[100%] absolute inset-0 opacity-0 pointer-events-none') : 'min-w-[400px] translate-x-0 relative'}
          `}
        >
          <div className="flex-none p-8 border-b border-outline-variant flex items-center justify-between bg-surface-container-high">
             <div className="flex items-center gap-4">
                <ShoppingCart className="w-6 h-6 text-primary" />
                <h2 className="text-sm font-black text-on-surface uppercase tracking-[0.3em]">Ticket Actuel <span className="sr-only">Active Ticket</span></h2>
             </div>
             <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-sans text-[11px] font-black tabular-nums border border-primary/20">
               {cart.length + (currentCommande?.lignes?.length || 0)} <span className="text-[9px] opacity-60 ml-1">PCS</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {cart.length === 0 && (!currentCommande || !currentCommande.lignes || currentCommande.lignes.length === 0) ? (
               <div className="h-full flex flex-col items-center justify-center p-12 opacity-10 gap-6">
                  <UtensilsCrossed className="w-16 h-16 stroke-[0.5]" />
                  <p className="font-sans text-[10px] font-black uppercase tracking-[0.5em] text-center">Ticket Vide <span className="sr-only">Ticket Buffer Empty</span></p>
               </div>
            ) : (
              <div className="flex flex-col">
                {/* Existing Commanded Items */}
                {currentCommande && currentCommande.lignes && currentCommande.lignes.length > 0 && (
                  <div className="flex flex-col border-b border-outline-variant">
                    <div className="px-8 py-3 bg-surface-container-highest/30 flex items-center justify-between border-b border-outline-variant/10">
                       <span className="font-sans text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Enregistré</span>
                       <span className="font-sans text-[10px] font-bold text-primary  uppercase tracking-tighter">ID: #{currentCommande.id}</span>
                    </div>
                    {currentCommande.lignes.map(ligne => (
                      <div key={ligne.id} className="px-8 py-5 border-b border-outline-variant/10 bg-surface-container-low/20 flex justify-between items-start group">
                        <div className="flex gap-4 min-w-0 flex-1">
                          <div className="h-10 w-10 rounded-xl bg-surface-container-highest flex items-center justify-center font-sans text-sm font-black text-on-surface-variant/60 tabular-nums border border-outline-variant/20">
                            {ligne.quantite}x
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <p className="font-body text-[15px] font-bold text-on-surface/80 truncate uppercase tracking-tight">{ligne.plat_nom || 'Item'}</p>
                            <div className="flex items-center gap-2.5 mt-1.5">
                               <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full font-sans text-[8px] font-black uppercase tracking-widest border transition-colors ${
                                 ligne.statut === 'SERVI' ? 'bg-success/10 text-success border-success/20' : 
                                 ligne.statut === 'PRET' ? 'bg-primary/10 text-primary border-primary/20 animate-pulse' : 
                                 'bg-surface-container-highest text-on-surface-variant/60 border-outline-variant/30'
                               }`}>
                                 {ligne.statut === 'PRET' && <CheckCircle2 className="w-2.5 h-2.5" />}
                                 {ligne.statut === 'EN_PREPARATION' && <Clock className="w-2.5 h-2.5 animate-spin" />}
                                 {ligne.statut}
                               </div>
                            </div>
                          </div>
                        </div>
                        <span className="font-sans text-[15px] font-black text-on-surface-variant tabular-nums mt-1">{(parseFloat(ligne.prix_unitaire || '0') * ligne.quantite).toFixed(0)} DH</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Cart Items */}
                {cart.length > 0 && (
                  <div className="flex flex-col">
                    <div className="px-8 py-3 bg-primary/5 flex items-center gap-3 border-b border-primary/10">
                       <Plus className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                       <span className="font-sans text-[10px] font-black uppercase tracking-widest text-primary">Nouveaux Articles</span>
                    </div>
                    {cart.map((item, idx) => (
                      <div key={`new-${item.plat.id}-${idx}`} data-testid={`cart-item-${item.plat.id}`} className="px-8 py-5 border-b border-outline-variant hover:bg-surface-container-high transition-all group bg-primary/[0.02] flex justify-between items-start">
                        <div className="flex gap-4 min-w-0 flex-1">
                          <div className="h-11 w-11 rounded-xl bg-primary/20 flex items-center justify-center font-sans text-base font-black text-primary tabular-nums border border-primary/30">
                             {item.quantite}x
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <p className="font-body text-[16px] font-bold text-on-surface truncate uppercase tracking-tight">{item.plat.nom}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <button onClick={() => updateCartQty(item.plat.id, -1)} data-testid="qty-minus" className="p-1.5 rounded-lg bg-surface-container border border-outline-variant hover:bg-primary hover:text-on-primary transition-all">
                                <Minus className="w-3.5 h-3.5" strokeWidth={3} />
                              </button>
                              <span className="font-sans text-sm font-black text-on-surface tabular-nums">{item.quantite}</span>
                              <button onClick={() => addToCart(item.plat)} data-testid="qty-plus" className="p-1.5 rounded-lg bg-surface-container border border-outline-variant hover:bg-primary hover:text-on-primary transition-all">
                                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0 py-0.5">
                          <span className="font-sans text-[17px] font-black text-primary tabular-nums">{(parseFloat(item.plat.prix) * item.quantite).toFixed(0)} DH</span>
                          <button onClick={() => removeFromCart(item.plat.id)} data-testid="remove-item" className="p-2 rounded-lg bg-error/5 text-error hover:bg-error/10 hover:text-error transition-all opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex-none p-8 bg-surface-container-high border-t border-outline-variant space-y-6 z-30">
            <div className="space-y-2.5">
              <div className="flex justify-between items-center font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-widest">
                <span>Déjà Commandé</span>
                <span className="tabular-nums">{existingTotal.toFixed(0)} DH</span>
              </div>
              <div className="flex justify-between items-center font-sans text-[11px] font-black text-primary uppercase tracking-widest">
                <span>En attente</span>
                <span className="tabular-nums">{cartTotal.toFixed(0)} DH</span>
              </div>
              <div className="pt-4 border-t border-outline-variant border-dashed flex justify-between items-center">
                <span className="font-serif text-2xl font-black text-on-surface  tracking-tight uppercase">TOTAL</span>
                <span className="font-sans text-3xl font-black text-primary tabular-nums tracking-tighter">{grandTotal.toFixed(0)} DH</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleSubmitOrder}
                disabled={cart.length === 0 || isSubmitting}
                data-testid="order-submit"
                className="w-full h-18 bg-primary text-on-primary rounded-2xl font-sans text-xs font-black uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 border-2 border-primary group disabled:opacity-20 disabled:grayscale"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" strokeWidth={3} />
                    <span>Envoyer en cuisine</span>
                  </>
                )}
              </button>
              
              {currentCommande && cart.length > 0 && (
                 <div className="flex items-center justify-center gap-2 py-2 px-4 rounded bg-surface-container border border-outline-variant/30">
                    <AlertCircle className="w-3.5 h-3.5 text-on-surface-variant" />
                    <p className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Envoyer la suite pour encaisser</p>
                 </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Mobile Floating Bar */}
      {isMobile && !showCart && (cart.length > 0 || (currentCommande?.lignes?.length || 0) > 0) && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-4rem)] max-w-md">
           <button 
             onClick={() => setShowCart(true)}
             className="w-full h-18 bg-background text-primary rounded-2xl flex items-center justify-between px-10 font-sans text-[12px] font-black uppercase tracking-[0.3em] border border-primary/30"
           >
             <span className="flex items-center gap-5">
               <ReceiptText className="w-6 h-6" strokeWidth={2.5} />
               <span>TICKET ({cart.length + (currentCommande?.lignes?.length || 0)})</span>
             </span>
             <div className="flex items-center gap-3">
                <span className="bg-primary/10 px-5 py-2 rounded-full border border-primary/20 tabular-nums">{grandTotal.toFixed(0)} DH</span>
                <ChevronRight className="w-5 h-5 opacity-30" />
             </div>
           </button>
        </div>
      )}

      {/* --- Payment Modal --- */}
      <AnimatePresence>
        {isPayModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-8 bg-on-surface/40">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-surface-container border border-outline-variant rounded-[2.5rem] overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
              
              <div className="p-10 md:p-12 border-b border-outline-variant bg-surface-container-high flex justify-between items-center">
                <div>
                  <h3 className="font-serif text-3xl font-black text-on-surface uppercase tracking-tight  leading-none">Règlement</h3>
                  <p className="text-[10px] font-bold text-primary uppercase mt-3 tracking-[0.4em]">Table {table?.numero} • Total : {parseFloat(currentCommande?.montant_total || '0').toFixed(0)} DH</p>
                </div>
                <button onClick={() => setIsPayModalOpen(false)} className="p-3 bg-surface-container-low hover:bg-surface-container-highest border border-outline-variant rounded-full transition-all text-on-surface-variant hover:text-primary">
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="p-10 md:p-12">
                <AnimatePresence mode="wait">
                  {paymentStep === 'CHOICE' ? (
                    <motion.div 
                      key="choice" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                      className="flex flex-col gap-6"
                    >
                      <button 
                        onClick={() => handleManualPay('CASH')}
                        className="group flex items-center gap-8 p-8 bg-surface-container-low border-2 border-outline-variant/30 rounded-[2rem] hover:border-success/40 hover:bg-success/5 transition-all text-left"
                      >
                         <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
                            <Banknote className="w-10 h-10" />
                         </div>
                         <div>
                            <p className="text-lg font-black text-on-surface uppercase tracking-widest">Espèces</p>
                            <p className="text-[9px] font-bold text-on-surface-variant uppercase mt-1 tracking-widest opacity-60">Validation physique immédiate</p>
                         </div>
                      </button>

                      <button 
                        onClick={() => handleManualPay('CARD')}
                        className="group flex items-center gap-8 p-8 bg-surface-container-low border-2 border-outline-variant/30 rounded-[2rem] hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                      >
                         <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <CreditCard className="w-10 h-10" />
                         </div>
                         <div>
                            <p className="text-lg font-black text-on-surface uppercase tracking-widest">Carte Bancaire</p>
                            <p className="text-[9px] font-bold text-on-surface-variant uppercase mt-1 tracking-widest opacity-60">Utilisation Terminal Externe</p>
                         </div>
                      </button>

                      <div className="flex items-center gap-6 py-4">
                          <div className="h-px flex-1 bg-outline-variant/20" />
                          <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Ou client scanne</span>
                          <div className="h-px flex-1 bg-outline-variant/20" />
                      </div>

                      <button 
                        onClick={handleGenerateQr}
                        className="group flex items-center gap-8 p-8 bg-background border-2 border-primary/20 rounded-[2rem] hover:scale-[1.02] transition-all text-left"
                      >
                         <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <QrCode className="w-10 h-10" />
                         </div>
                         <div>
                            <p className="text-lg font-black text-primary uppercase tracking-widest ">Lien de Paiement QR</p>
                            <p className="text-[9px] font-bold text-on-surface-variant uppercase mt-1 tracking-widest">Apple Pay, Google Pay, Carte</p>
                         </div>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="qr" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col items-center text-center space-y-10"
                    >
                       <div className="p-10 bg-white rounded-[3rem] border-8 border-surface">
                          {qrData && (
                            <QRCodeSVG 
                                value={qrData.url}
                                size={260}
                                level="H"
                                fgColor="#151312"
                            />
                          )}
                       </div>
                       
                       <div className="space-y-4">
                          <p className="font-serif text-2xl  text-on-surface leading-tight px-4 uppercase font-black tracking-tighter">Code de Règlement Sécurisé</p>
                          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.4em] leading-relaxed opacity-60">
                            Session: {qrData?.token?.substring(0, 8)}...
                          </p>
                       </div>

                       <div className="w-full flex gap-6">
                          <button onClick={() => setPaymentStep('CHOICE')} className="flex-1 h-16 border-2 border-outline-variant rounded-2xl font-black uppercase tracking-widest text-[11px] text-on-surface-variant hover:bg-surface-container-high">Retour</button>
                          <a href={qrData?.url} target="_blank" rel="noreferrer" className="flex-1 h-16 bg-primary text-on-primary rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3">Lien Direct <ExternalLink className="w-4 h-4" /></a>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
