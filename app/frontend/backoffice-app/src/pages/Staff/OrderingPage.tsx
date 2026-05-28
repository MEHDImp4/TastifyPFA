import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { salleApi } from '../../api/salle';
import { menuApi } from '../../api/menu';
import type { Table, Commande } from '../../types/salle';
import type { Plat, Categorie } from '../../types/menu';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2, 
  Loader2, 
  Send, 
  History, 
  Search,
  ShoppingCart,
  X,
  CreditCard,
  Banknote,
  QrCode,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

// --- Constants ---
const MUTABLE_COMMANDE_PRIORITY: Record<string, number> = {
  EN_COURS: 0,
  EN_CUISINE: 1,
  PRETE: 2,
};

const selectCurrentCommande = (commandes: Commande[]): Commande | null => {
    return [...commandes].sort((left, right) => {
      const priorityDiff = MUTABLE_COMMANDE_PRIORITY[left.statut] - MUTABLE_COMMANDE_PRIORITY[right.statut];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return left.id - right.id;
    })[0] ?? null;
  };

export const OrderingPage: React.FC = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  
  const [table, setTable] = useState<Table | null>(null);
  const [currentCommande, setCurrentCommande] = useState<Commande | null>(null);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  
  const [cart, setCart] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'CHOICE' | 'QR'>('CHOICE');
  const [qrData, setQrData] = useState<{ token: string, url: string } | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [tablesRes, cmdRes, platsRes, catsRes] = await Promise.all([
        salleApi.getTables(),
        salleApi.getCommandeByTable(Number(tableId)),
        menuApi.getPlats(),
        menuApi.getCategories()
      ]);

      const currentTable = tablesRes.data.find(t => t.id === Number(tableId));
      setTable(currentTable || null);

      const activeCmd = selectCurrentCommande(cmdRes.data);
      setCurrentCommande(activeCmd);
      
      setPlats(platsRes.data);
      setCategories(catsRes.data.sort((a, b) => a.ordre_affichage - b.ordre_affichage));
      
      if (!activeCat && catsRes.data.length > 0) {
          setActiveCat(catsRes.data[0].id);
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
      } else {
        const orderRes = await salleApi.createCommande({
          table: Number(tableId),
          type: 'SUR_PLACE',
          lignes: lignes as any // Bypass strict array type for draft lines
        });
        await salleApi.updateCommandeStatut(orderRes.data.id, 'EN_CUISINE');
      }
      toast.success('Commande envoyée en cuisine');
      setCart([]);
      await fetchData(true);
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

  if (isLoading) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
      <Loader2 className="w-12 h-12 animate-spin text-primary" strokeWidth={2.5}/>
      <p className="font-sans text-[10px] font-black uppercase tracking-[0.4em] text-primary mt-6 animate-pulse">Sourcing Data...</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-surface-container-lowest p-0 selection:bg-primary/20 selection:text-primary font-body overflow-hidden">
      
      {/* Tactical Header */}
      <header className="flex-none flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4 md:px-staff-margin h-20 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/salle')} className="p-2.5 rounded-xl hover:bg-surface-container-high transition-all text-on-surface border border-outline-variant/30">
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="font-serif text-2xl font-black text-on-surface tracking-widest uppercase">Table {table?.numero}</h1>
               <span className="px-2 py-0.5 rounded-sm bg-primary/10 text-primary font-sans text-[9px] font-black uppercase tracking-widest">Zone A</span>
            </div>
            <p className="font-sans text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mt-1">Terminal de prise de commande</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           {currentCommande && (
               <div className="text-right hidden md:block">
                  <p className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Addition en cours</p>
                  <p className="font-mono text-xl font-black text-primary">{parseFloat(currentCommande.montant_total).toFixed(2)} DH</p>
               </div>
           )}
           <button 
             onClick={handleOpenPayModal}
             disabled={!currentCommande || isPaying}
             className="h-12 px-6 bg-success text-on-success rounded-xl font-sans text-xs font-black uppercase tracking-widest shadow-lg shadow-success/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
           >
             Encaisser
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Menu Explorer (8 cols) */}
        <section className="flex-1 flex flex-col min-w-0 border-r border-outline-variant bg-surface-container-lowest">
          
          {/* Categories Strip */}
          <div className="flex-none h-16 border-b border-outline-variant bg-surface-container-low flex gap-2 p-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`px-6 rounded-lg font-sans text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCat === cat.id ? 'bg-on-surface text-background shadow-md' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                {cat.nom}
              </button>
            ))}
          </div>

          {/* Search Strip */}
          <div className="flex-none p-4 border-b border-outline-variant bg-surface-container-lowest">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" placeholder="RECHERCHE RAPIDE..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-12 bg-surface-container-low border border-outline-variant rounded-xl pl-12 pr-4 font-sans text-xs font-bold text-on-surface focus:border-primary outline-none transition-all uppercase placeholder:text-on-surface-variant/20"
                />
             </div>
          </div>

          {/* Plats Grid */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
               {filteredPlats.map(plat => (
                 <button
                   key={plat.id}
                   onClick={() => addToCart(plat)}
                   className="group relative flex flex-col bg-surface-container-low border border-outline-variant rounded-2xl p-4 text-left transition-all hover:border-primary/40 hover:bg-surface-container-high hover:shadow-xl active:scale-95"
                 >
                    <div className="flex justify-between items-start mb-3">
                       <h3 className="font-serif text-sm font-black text-on-surface uppercase tracking-tighter leading-tight pr-8">{plat.nom}</h3>
                       <span className="font-mono text-xs font-bold text-primary">{parseFloat(plat.prix).toFixed(0)}</span>
                    </div>
                    <p className="font-sans text-[10px] text-on-surface-variant leading-relaxed line-clamp-2 opacity-60 group-hover:opacity-100 transition-opacity uppercase">{plat.description}</p>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-lg">
                          <Plus className="w-4 h-4" strokeWidth={3} />
                       </div>
                    </div>
                 </button>
               ))}
            </div>
          </div>
        </section>

        {/* Right: Order / Cart (4 cols) */}
        <section className="w-80 md:w-[400px] flex flex-col bg-surface-container-lowest">
          <div className="flex-none p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
             <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h2 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.3em]">Commande Active</h2>
             </div>
             <span className="font-mono text-xs font-bold text-on-surface-variant/40">v1.4.2</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
            
            {/* Persisted Order Lines */}
            {currentCommande && currentCommande.lignes.length > 0 && (
                <div className="space-y-4">
                    <p className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/30 pb-2">Plats déjà envoyés</p>
                    {currentCommande.lignes.map(ligne => (
                        <div key={ligne.id} className="flex items-center justify-between opacity-60">
                            <div className="flex gap-3">
                                <span className="font-mono text-xs font-bold">{ligne.quantite}x</span>
                                <span className="font-sans text-xs font-black uppercase tracking-tight">{ligne.plat_nom}</span>
                            </div>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${ligne.statut === 'PRET' ? 'bg-success/10 border-success/30 text-success' : 'bg-primary/10 border-primary/30 text-primary'}`}>
                                {ligne.statut}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Current Draft Cart */}
            <div className="space-y-4">
               <p className="font-sans text-[9px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2">Nouveaux éléments</p>
               <AnimatePresence mode="popLayout">
                  {cart.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center opacity-10 gap-4">
                       <History className="w-12 h-12" strokeWidth={1} />
                       <p className="font-sans text-[10px] font-black uppercase tracking-[0.4em]">Panier vide</p>
                    </div>
                  ) : cart.map(item => (
                    <motion.div 
                      key={item.plat.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex gap-3 min-w-0 pr-2">
                        <span className="font-sans text-[15px] font-black text-primary w-6 text-right tabular-nums">{item.quantite}x</span>
                        <div className="flex-1 min-w-0">
                           <p className="font-sans text-xs font-black text-on-surface uppercase tracking-tight truncate">{item.plat.nom}</p>
                           <input 
                             type="text" placeholder="Note..." value={item.notes} 
                             onChange={(e) => setCart(prev => prev.map(i => i.plat.id === item.plat.id ? { ...i, notes: e.target.value } : i))}
                             className="w-full bg-transparent border-0 p-0 font-sans text-[9px] font-bold text-on-surface-variant/40 focus:text-primary outline-none uppercase tracking-widest mt-0.5"
                           />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => updateCartQty(item.plat.id, -1)} className="p-1 hover:text-primary"><Minus className="w-3.5 h-3.5" /></button>
                         <button onClick={() => updateCartQty(item.plat.id, 1)} className="p-1 hover:text-primary"><Plus className="w-3.5 h-3.5" /></button>
                         <button onClick={() => removeFromCart(item.plat.id)} className="p-1 hover:text-error ml-2"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </motion.div>
                  ))}
               </AnimatePresence>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex-none p-6 bg-surface-container-low border-t border-outline-variant space-y-6">
            <div className="flex justify-between items-end">
               <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Sous-total</span>
               <span className="font-mono text-2xl font-black text-on-surface">{cartTotal.toFixed(0)} DH</span>
            </div>
            
            <button 
              onClick={handleSubmitOrder}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full h-16 bg-primary text-on-primary rounded-xl font-sans text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-20 disabled:grayscale"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Envoyer en cuisine</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>

      {/* --- Payment Selection Modal --- */}
      <AnimatePresence>
        {isPayModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-surface-container rounded-3xl border border-outline-variant shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-outline-variant bg-surface-main flex justify-between items-center">
                <div>
                  <h3 className="font-serif text-2xl font-black text-on-surface uppercase tracking-widest">Encaisser Table {table?.numero}</h3>
                  <p className="font-sans text-[10px] font-black text-primary uppercase mt-1 tracking-[0.3em]">Total : {parseFloat(currentCommande?.montant_total || '0').toFixed(2)} DH</p>
                </div>
                <button onClick={() => setIsPayModalOpen(false)} className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-on-surface-variant">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8">
                <AnimatePresence mode="wait">
                  {paymentStep === 'CHOICE' ? (
                    <motion.div 
                      key="choice" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                      className="grid grid-cols-1 gap-4"
                    >
                      <button 
                        onClick={() => handleManualPay('CASH')}
                        className="group flex items-center gap-6 p-6 bg-surface-main border border-outline-variant rounded-2xl hover:border-success/50 hover:bg-success/5 transition-all text-left"
                      >
                         <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
                            <Banknote className="w-8 h-8" />
                         </div>
                         <div>
                            <p className="font-sans text-[13px] font-black text-on-surface uppercase tracking-widest">Espèces / Cash</p>
                            <p className="font-sans text-[10px] font-bold text-on-surface-variant/40 uppercase mt-1">Règlement physique immédiat</p>
                         </div>
                      </button>

                      <button 
                        onClick={() => handleManualPay('CARD')}
                        className="group flex items-center gap-6 p-6 bg-surface-main border border-outline-variant rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                      >
                         <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <CreditCard className="w-8 h-8" />
                         </div>
                         <div>
                            <p className="font-sans text-[13px] font-black text-on-surface uppercase tracking-widest">Carte Bancaire / TPE</p>
                            <p className="font-sans text-[10px] font-bold text-on-surface-variant/40 uppercase mt-1">Validation via terminal externe</p>
                         </div>
                      </button>

                      <div className="h-px bg-outline-variant/30 my-4" />

                      <button 
                        onClick={handleGenerateQr}
                        className="group flex items-center gap-6 p-6 bg-[#1a1614] border border-[#C5A059]/20 rounded-2xl hover:border-[#C5A059] transition-all text-left"
                      >
                         <div className="w-14 h-14 rounded-xl bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059] group-hover:scale-110 transition-transform">
                            <QrCode className="w-8 h-8" />
                         </div>
                         <div>
                            <p className="font-sans text-[13px] font-black text-[#FAF9F6] uppercase tracking-widest">Paiement Mobile (QR)</p>
                            <p className="font-sans text-[10px] font-bold text-[#C5A059] uppercase mt-1">Lien sécurisé pour le client</p>
                         </div>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="qr" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col items-center text-center space-y-8"
                    >
                       <div className="p-8 bg-white rounded-3xl shadow-inner border border-outline-variant/30 text-black">
                          {qrData && (
                            <QRCodeSVG 
                                value={`${window.location.origin}${qrData.url}`}
                                size={200}
                                level="H"
                                includeMargin={false}
                                fgColor="#2D2424"
                            />
                          )}
                       </div>
                       
                       <div className="space-y-3">
                          <p className="font-serif text-xl italic text-on-surface">Veuillez présenter ce code au convive.</p>
                          <p className="font-sans text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.3em]">L'addition sera automatiquement soldée après règlement.</p>
                       </div>

                       <div className="w-full flex gap-4">
                          <button 
                            onClick={() => setPaymentStep('CHOICE')}
                            className="flex-1 h-14 border border-outline-variant rounded-xl font-sans text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-all"
                          >
                             Retour
                          </button>
                          <a 
                            href={qrData?.url} target="_blank" rel="noreferrer"
                            className="flex-1 h-14 bg-primary text-on-primary rounded-xl font-sans text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                          >
                             Ouvrir le lien <ExternalLink className="w-3.5 h-3.5" />
                          </a>
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
