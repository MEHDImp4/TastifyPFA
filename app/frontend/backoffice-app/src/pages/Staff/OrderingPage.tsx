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
      <Loader2 className="w-12 h-12 animate-spin text-on-background" strokeWidth={1}/>
      <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-on-surface-variant mt-8">Chargement...</p>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-background p-0 selection:bg-on-background/10 font-body overflow-hidden text-on-background">
      
      {/* Tactical Header */}
      <header className="flex-none h-20 bg-surface border-b border-outline px-4 md:px-staff-margin flex items-center justify-between z-30">
        <div className="flex items-center gap-4 md:gap-8">
          <button onClick={() => navigate('/salle')} className="w-12 h-12 rounded-lg bg-surface border border-outline hover:text-on-background transition-all flex items-center justify-center active:scale-95">
            <ArrowLeft className="w-6 h-6" strokeWidth={1.5} />
          </button>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-on-background leading-none">Table {table?.numero}</h1>
               {currentCommande && (
                   <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-container-high text-on-background border border-outline font-mono text-[9px] font-bold uppercase tracking-widest">
                     <Hash className="w-3 h-3 opacity-20" /> {currentCommande.id}
                   </div>
               )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <div className="relative group hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-on-background" />
            <input 
              type="text"
              placeholder="RECHERCHER..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 md:w-64 h-11 bg-background border border-outline pl-10 pr-4 rounded-md font-sans text-xs font-bold text-on-surface focus:border-on-background outline-none transition-all placeholder:text-on-surface-variant/30 uppercase"
            />
          </div>
          
           <button 
             onClick={handleOpenPayModal}
             disabled={!currentCommande || isPaying}
             className="btn-primary h-12 md:h-14 px-6 md:px-8 bg-success text-on-success border-success hover:brightness-110 disabled:opacity-20"
           >
             Encaisser {currentCommande ? `${parseFloat(currentCommande.montant_total).toFixed(0)} DH` : ''}
           </button>
           
           <button onClick={() => fetchData(true)} className="p-3 rounded-lg bg-surface border border-outline text-on-surface-variant hover:text-on-background transition-all active:rotate-180 duration-500">
            <RefreshCcw className="w-5 h-5" strokeWidth={1.5} />
          </button>

          {isMobile && (
            <button 
              onClick={() => setShowCart(!showCart)}
              className={`p-3 rounded-lg relative transition-all border ${showCart ? 'bg-on-background border-on-background text-background' : 'bg-surface border-outline text-on-background'}`}
            >
              {showCart ? <UtensilsCrossed className="w-6 h-6" /> : <ReceiptText className="w-6 h-6" />}
              {(cart.length > 0 || (currentCommande?.lignes?.length || 0) > 0) && !showCart && (
                <span className="absolute -top-1.5 -right-1.5 bg-error text-on-error text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-background">
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
            flex-[7] flex flex-col min-w-0 border-r border-outline bg-background transition-all duration-500 ease-in-out
            ${isMobile && showCart ? 'translate-x-[-100%] absolute inset-0 z-0 opacity-0 pointer-events-none' : 'translate-x-0 relative z-10'}
          `}
        >
          {/* Categories */}
          <div className="flex-none h-16 border-b border-outline bg-surface flex gap-2.5 p-2 overflow-x-auto no-scrollbar">
            <button
                onClick={() => setActiveCat(null)}
                className={`px-6 rounded-md font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border ${activeCat === null ? 'bg-on-background text-background border-on-background' : 'bg-background border-outline text-on-surface-variant hover:border-on-background hover:text-on-background'}`}
            >
              Tous
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`px-6 rounded-md font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border ${activeCat === cat.id ? 'bg-on-background text-background border-on-background' : 'bg-background border-outline text-on-surface-variant hover:border-on-background hover:text-on-background'}`}
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
                     group atelier-card p-4 md:p-6 text-left transition-all hover:border-on-background active:scale-[0.96] relative overflow-hidden h-40 md:h-48
                     ${!plat.est_disponible ? 'opacity-20 grayscale cursor-not-allowed border-dashed' : ''}
                   `}
                   disabled={!plat.est_disponible}
                 >
                    <div className="flex flex-col gap-1">
                       <h3 className="text-base md:text-lg font-bold text-on-surface uppercase tracking-tight leading-tight line-clamp-2">{plat.nom}</h3>
                       <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">
                         {categories.find(c => c.id === plat.categorie)?.nom}
                       </span>
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                       <span className="font-mono text-lg md:text-xl font-bold text-on-background tabular-nums">{parseFloat(plat.prix).toFixed(0)} DH</span>
                       <div className="size-10 rounded-md bg-background border border-outline flex items-center justify-center group-hover:bg-on-background group-hover:border-on-background transition-all">
                          <Plus className="w-5 h-5 text-on-surface group-hover:text-background" strokeWidth={3} />
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
            flex-[3] flex flex-col bg-surface border-l border-outline z-20 transition-all duration-500 ease-in-out
            ${isMobile ? (showCart ? 'w-full translate-x-0 relative' : 'w-full translate-x-[100%] absolute inset-0 opacity-0 pointer-events-none') : 'min-w-[400px] translate-x-0 relative'}
          `}
        >
          <div className="flex-none p-8 border-b border-outline flex items-center justify-between bg-surface-container-high">
             <div className="flex items-center gap-4">
                <ShoppingCart className="w-6 h-6 text-on-background opacity-20" strokeWidth={1.5}/>
                <h2 className="text-sm font-bold text-on-surface uppercase tracking-[0.3em]">Ticket Actuel <span className="sr-only">Active Ticket</span></h2>
             </div>
             <div className="bg-on-background text-background px-3 py-1 rounded-md font-mono text-[10px] font-bold tabular-nums">
               {cart.length + (currentCommande?.lignes?.length || 0)} <span className="text-[9px] opacity-40 ml-1 uppercase">PCS</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {cart.length === 0 && (!currentCommande || !currentCommande.lignes || currentCommande.lignes.length === 0) ? (
               <div className="h-full flex flex-col items-center justify-center p-12 opacity-10 gap-6">
                  <UtensilsCrossed className="w-16 h-16 stroke-[0.5]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-center">Ticket Vide <span className="sr-only">Ticket Buffer Empty</span></p>
               </div>
            ) : (
              <div className="flex flex-col">
                {/* Existing Commanded Items */}
                {currentCommande && currentCommande.lignes && currentCommande.lignes.length > 0 && (
                  <div className="flex flex-col border-b border-outline">
                    <div className="px-8 py-3 bg-surface-container-high/50 flex items-center justify-between border-b border-outline">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-40">Enregistré</span>
                       <span className="font-mono text-[10px] font-bold text-on-background uppercase">ID: #{currentCommande.id}</span>
                    </div>
                    {currentCommande.lignes.map(ligne => (
                      <div key={ligne.id} className="px-8 py-5 border-b border-outline/5 bg-background flex justify-between items-start group">
                        <div className="flex gap-4 min-w-0 flex-1">
                          <div className="h-10 w-10 rounded-md bg-surface-container-high flex items-center justify-center font-mono text-sm font-bold text-on-surface-variant tabular-nums border border-outline">
                            {ligne.quantite}x
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <p className="text-[15px] font-bold text-on-surface truncate uppercase tracking-tight">{ligne.plat_nom || 'Item'}</p>
                            <div className="flex items-center gap-2.5 mt-1.5">
                               <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[8px] font-bold uppercase tracking-widest transition-colors ${
                                 ligne.statut === 'SERVI' ? 'bg-success/5 text-success border-success/20' : 
                                 ligne.statut === 'PRET' ? 'bg-on-background text-background border-on-background' : 
                                 'bg-surface-container-high text-on-surface-variant border-outline'
                               }`}>
                                 {ligne.statut === 'PRET' && <CheckCircle2 className="w-2.5 h-2.5" />}
                                 {ligne.statut === 'EN_PREPARATION' && <Clock className="w-2.5 h-2.5 animate-spin" />}
                                 {ligne.statut}
                               </div>
                            </div>
                          </div>
                        </div>
                        <span className="font-mono text-[14px] font-bold text-on-surface-variant tabular-nums mt-1">{(parseFloat(ligne.prix_unitaire || '0') * ligne.quantite).toFixed(0)} DH</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Cart Items */}
                {cart.length > 0 && (
                  <div className="flex flex-col">
                    <div className="px-8 py-3 bg-on-background/5 flex items-center gap-3 border-b border-outline">
                       <Plus className="w-3.5 h-3.5 text-on-background" strokeWidth={3} />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-on-background">Nouveaux Articles</span>
                    </div>
                    {cart.map((item, idx) => (
                      <div key={`new-${item.plat.id}-${idx}`} data-testid={`cart-item-${item.plat.id}`} className="px-8 py-5 border-b border-outline hover:bg-surface-container-high transition-all group bg-surface-container-low/30 flex justify-between items-start">
                        <div className="flex gap-4 min-w-0 flex-1">
                          <div className="h-11 w-11 rounded-md bg-on-background text-background flex items-center justify-center font-mono text-base font-bold tabular-nums">
                             {item.quantite}x
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <p className="text-[16px] font-bold text-on-surface truncate uppercase tracking-tight">{item.plat.nom}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <button onClick={() => updateCartQty(item.plat.id, -1)} data-testid="qty-minus" className="p-1.5 rounded border border-outline bg-background hover:bg-on-background hover:text-background transition-all">
                                <Minus className="w-3.5 h-3.5" strokeWidth={3} />
                              </button>
                              <span className="font-mono text-sm font-bold text-on-surface tabular-nums">{item.quantite}</span>
                              <button onClick={() => addToCart(item.plat)} data-testid="qty-plus" className="p-1.5 rounded border border-outline bg-background hover:bg-on-background hover:text-background transition-all">
                                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0 py-0.5">
                          <span className="font-mono text-[17px] font-bold text-on-background tabular-nums">{(parseFloat(item.plat.prix) * item.quantite).toFixed(0)} DH</span>
                          <button onClick={() => removeFromCart(item.plat.id)} data-testid="remove-item" className="p-2 rounded-md bg-error/5 text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-5 h-5" strokeWidth={1.5} />
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
          <div className="flex-none p-8 bg-surface-container-high border-t border-outline space-y-6 z-30">
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">
                <span>Enregistré</span>
                <span className="font-mono tabular-nums">{existingTotal.toFixed(0)} DH</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-on-background uppercase tracking-widest">
                <span>Nouveaux</span>
                <span className="font-mono tabular-nums">{cartTotal.toFixed(0)} DH</span>
              </div>
              <div className="pt-4 border-t border-outline border-dashed flex justify-between items-center">
                <span className="text-2xl font-bold text-on-surface tracking-tight uppercase">TOTAL</span>
                <span className="font-mono text-3xl font-bold text-on-background tabular-nums tracking-tighter">{grandTotal.toFixed(0)} DH</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleSubmitOrder}
                disabled={cart.length === 0 || isSubmitting}
                data-testid="order-submit"
                className="w-full h-18 btn-primary rounded-xl text-[11px] uppercase tracking-[0.4em] gap-4 disabled:opacity-20"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <Send className="w-5 h-5" strokeWidth={2} />
                    <span>Envoyer en cuisine</span>
                  </>
                )}
              </button>
              
              {currentCommande && cart.length > 0 && (
                 <div className="flex items-center justify-center gap-2 py-2 px-4 rounded bg-background border border-outline">
                    <AlertCircle className="w-3.5 h-3.5 text-on-surface-variant opacity-40" />
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">Envoyer la suite pour encaisser</p>
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
             className="w-full h-18 bg-surface-container-high text-on-background rounded-2xl flex items-center justify-between px-8 font-bold text-[11px] uppercase tracking-[0.2em] border border-outline shadow-2xl"
           >
             <span className="flex items-center gap-4">
               <ReceiptText className="w-5 h-5" strokeWidth={1.5} />
               <span>TICKET ({cart.length + (currentCommande?.lignes?.length || 0)})</span>
             </span>
             <div className="flex items-center gap-3">
                <span className="bg-on-background text-background px-4 py-1.5 rounded font-mono tabular-nums">{grandTotal.toFixed(0)} DH</span>
                <ChevronRight className="w-4 h-4 opacity-20" />
             </div>
           </button>
        </div>
      )}

      {/* --- Payment Modal --- */}
      <AnimatePresence>
        {isPayModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-8 bg-on-background/10 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-xl bg-surface border border-outline rounded-xl overflow-hidden relative shadow-2xl"
            >
              <div className="p-10 md:p-12 border-b border-outline bg-surface-container-high flex justify-between items-center">
                <div>
                  <h3 className="text-3xl font-bold text-on-surface uppercase tracking-tight leading-none">Règlement</h3>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase mt-3 tracking-[0.4em]">Table {table?.numero} • Total : {parseFloat(currentCommande?.montant_total || '0').toFixed(0)} DH</p>
                </div>
                <button onClick={() => setIsPayModalOpen(false)} className="p-2 border border-outline rounded hover:bg-background transition-all text-on-surface-variant">
                  <X className="w-6 h-6" strokeWidth={1.5}/>
                </button>
              </div>

              <div className="p-10 md:p-12">
                <AnimatePresence mode="wait">
                  {paymentStep === 'CHOICE' ? (
                    <motion.div 
                      key="choice" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                      className="flex flex-col gap-6"
                    >
                      <button 
                        onClick={() => handleManualPay('CASH')}
                        className="group flex items-center gap-6 p-8 bg-background border border-outline rounded-lg hover:border-on-background transition-all text-left"
                      >
                         <div className="w-14 h-14 rounded bg-success/5 flex items-center justify-center text-success">
                            <Banknote className="w-8 h-8" strokeWidth={1.5}/>
                         </div>
                         <div>
                            <p className="text-lg font-bold text-on-surface uppercase tracking-widest">Espèces</p>
                            <p className="text-[9px] font-bold text-on-surface-variant uppercase mt-1 tracking-widest opacity-40">Validation physique immédiate</p>
                         </div>
                      </button>

                      <button 
                        onClick={() => handleManualPay('CARD')}
                        className="group flex items-center gap-6 p-8 bg-background border border-outline rounded-lg hover:border-on-background transition-all text-left"
                      >
                         <div className="w-14 h-14 rounded bg-on-background/5 flex items-center justify-center text-on-background">
                            <CreditCard className="w-8 h-8" strokeWidth={1.5}/>
                         </div>
                         <div>
                            <p className="text-lg font-bold text-on-surface uppercase tracking-widest">Carte Bancaire</p>
                            <p className="text-[9px] font-bold text-on-surface-variant uppercase mt-1 tracking-widest opacity-40">Utilisation Terminal Externe</p>
                         </div>
                      </button>

                      <div className="flex items-center gap-6 py-4">
                          <div className="h-px flex-1 bg-outline" />
                          <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest opacity-30">Ou client scanne</span>
                          <div className="h-px flex-1 bg-outline" />
                      </div>

                      <button 
                        onClick={handleGenerateQr}
                        className="group flex items-center gap-6 p-8 bg-on-background text-background rounded-lg hover:brightness-110 transition-all text-left"
                      >
                         <div className="w-14 h-14 rounded bg-background/10 flex items-center justify-center text-background">
                            <QrCode className="w-8 h-8" strokeWidth={1.5}/>
                         </div>
                         <div>
                            <p className="text-lg font-bold uppercase tracking-widest">Lien de Paiement QR</p>
                            <p className="text-[9px] font-bold uppercase mt-1 tracking-widest opacity-60">Apple Pay, Google Pay, Carte</p>
                         </div>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="qr" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                      className="flex flex-col items-center text-center space-y-10"
                    >
                       <div className="p-8 bg-white rounded-lg border border-outline">
                          {qrData && (
                            <QRCodeSVG 
                                value={qrData.url}
                                size={240}
                                level="H"
                                fgColor="#111111"
                            />
                          )}
                       </div>
                       
                       <div className="space-y-4">
                          <p className="text-2xl text-on-surface uppercase font-bold tracking-tight">Code de Règlement Sécurisé</p>
                          <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-[0.4em] opacity-40">
                            Session: {qrData?.token?.substring(0, 8)}...
                          </p>
                       </div>

                       <div className="w-full flex gap-4">
                          <button onClick={() => setPaymentStep('CHOICE')} className="flex-1 h-14 border border-outline rounded-md font-bold uppercase tracking-widest text-[10px] text-on-surface-variant hover:bg-background transition-all">Retour</button>
                          <a href={qrData?.url} target="_blank" rel="noreferrer" className="btn-primary flex-1 h-14 uppercase text-[10px] gap-3">Lien Direct <ExternalLink className="w-4 h-4" /></a>
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
