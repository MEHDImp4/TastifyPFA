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
          lignes: lignes as any
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
    <div className="flex-1 h-full min-h-0 flex flex-col bg-[#0a0a0a] text-white selection:bg-primary/20 overflow-hidden">
      
      {/* Tactical Header */}
      <header className="flex-none h-20 bg-[#121212] border-b border-[#333333] px-6 flex items-center justify-between shadow-lg z-30">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/salle')} className="w-12 h-12 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] flex items-center justify-center transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-2xl font-black uppercase tracking-widest leading-none text-white">Table {table?.numero}</h1>
               <span className="px-2 py-0.5 rounded-sm bg-primary/10 text-primary font-sans text-[9px] font-black uppercase tracking-widest border border-primary/20">Zone A</span>
            </div>
            <p className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.3em] mt-1">Terminal de prise de commande</p>
          </div>
        </div>
        
        <div className="flex items-center gap-10">
           {currentCommande && (
               <div className="text-right hidden md:block border-r border-[#333333] pr-10 h-10 flex flex-col justify-center">
                  <p className="text-[10px] font-black text-[#888888] uppercase tracking-widest">Addition en cours</p>
                  <p className="font-mono text-xl font-black text-primary leading-none mt-1">{parseFloat(currentCommande.montant_total).toFixed(2)} DH</p>
               </div>
           )}
           <button 
             onClick={handleOpenPayModal}
             disabled={!currentCommande || isPaying}
             className="h-14 px-8 bg-[#00e676] text-black rounded-xl font-sans text-xs font-black uppercase tracking-widest shadow-xl shadow-[#00e676]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
           >
             Encaisser
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left: Menu Explorer */}
        <section className="flex-1 flex flex-col min-w-0 border-r border-[#333333] bg-[#0a0a0a]">
          
          {/* Categories Strip */}
          <div className="flex-none h-16 border-b border-[#333333] bg-[#121212] flex gap-2 p-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`px-8 rounded-lg font-sans text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCat === cat.id ? 'bg-white text-black shadow-lg' : 'text-[#888888] hover:bg-[#1a1a1a] hover:text-white'}`}
              >
                {cat.nom}
              </button>
            ))}
          </div>

          {/* Search Strip */}
          <div className="flex-none p-6 border-b border-[#333333] bg-[#0a0a0a]">
             <div className="relative group max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888] group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" placeholder="RECHERCHE RAPIDE..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-14 bg-[#121212] border border-[#333333] rounded-xl pl-12 pr-4 font-sans text-sm font-bold text-white focus:border-primary outline-none transition-all uppercase placeholder:text-[#333333]"
                />
             </div>
          </div>

          {/* Plats Grid */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#0a0a0a]">
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
               {filteredPlats.map(plat => (
                 <button
                   key={plat.id}
                   onClick={() => addToCart(plat)}
                   className="group relative flex flex-col bg-[#121212] border-2 border-[#333333] rounded-2xl p-6 text-left transition-all hover:border-primary hover:bg-[#1a1a1a] hover:shadow-2xl active:scale-95"
                 >
                    <div className="flex justify-between items-start mb-4">
                       <h3 className="font-serif text-lg font-black text-white uppercase tracking-tighter leading-tight pr-8">{plat.nom}</h3>
                       <span className="font-mono text-lg font-black text-primary">{parseFloat(plat.prix).toFixed(0)}</span>
                    </div>
                    <p className="font-sans text-[11px] text-[#888888] leading-relaxed line-clamp-2 uppercase tracking-wide group-hover:text-white/70 transition-colors">{plat.description}</p>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-black shadow-lg">
                          <Plus className="w-5 h-5" strokeWidth={4} />
                       </div>
                    </div>
                 </button>
               ))}
            </div>
          </div>
        </section>

        {/* Right: Order / Cart */}
        <section className="w-96 flex flex-col bg-[#121212] border-l border-[#333333]">
          <div className="flex-none p-8 border-b border-[#333333] flex items-center justify-between bg-[#1a1a1a]">
             <div className="flex items-center gap-4">
                <ShoppingCart className="w-6 h-6 text-primary" />
                <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">Commande Active</h2>
             </div>
             <span className="font-mono text-[10px] font-black text-[#555555]">STAFF V1.4.2</span>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
            
            {/* Persisted Order Lines */}
            {currentCommande && currentCommande.lignes.length > 0 && (
                <div className="space-y-6">
                    <p className="text-[10px] font-black text-[#888888] uppercase tracking-widest border-b border-[#333333] pb-3">Plats déjà envoyés</p>
                    {currentCommande.lignes.map(ligne => (
                        <div key={ligne.id} className="flex items-center justify-between opacity-60">
                            <div className="flex gap-4 items-center">
                                <span className="font-mono text-lg font-black text-primary">{ligne.quantite}x</span>
                                <span className="font-sans text-xs font-black uppercase tracking-tight text-white">{ligne.plat_nom}</span>
                            </div>
                            <span className={`text-[9px] font-black px-3 py-1 rounded border ${ligne.statut === 'PRET' ? 'bg-[#00e676]/10 border-[#00e676]/30 text-[#00e676]' : 'bg-primary/10 border-primary/30 text-primary'}`}>
                                {ligne.statut}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Current Draft Cart */}
            <div className="space-y-6">
               <p className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-3">Nouveaux éléments</p>
               <AnimatePresence mode="popLayout">
                  {cart.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center opacity-10 gap-6">
                       <History className="w-16 h-16" strokeWidth={1} />
                       <p className="font-sans text-xs font-black uppercase tracking-[0.5em]">Panier vide</p>
                    </div>
                  ) : cart.map(item => (
                    <motion.div 
                      key={item.plat.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex gap-4 min-w-0 pr-4">
                        <span className="font-mono text-2xl font-black text-primary w-8 text-right">{item.quantite}x</span>
                        <div className="flex-1 min-w-0">
                           <p className="text-[13px] font-black text-white uppercase tracking-tight truncate">{item.plat.nom}</p>
                           <input 
                             type="text" placeholder="Note particulière..." value={item.notes} 
                             onChange={(e) => setCart(prev => prev.map(i => i.plat.id === item.plat.id ? { ...i, notes: e.target.value } : i))}
                             className="w-full bg-transparent border-0 p-0 font-sans text-[10px] font-bold text-[#555555] focus:text-primary outline-none uppercase tracking-widest mt-1"
                           />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => updateCartQty(item.plat.id, -1)} className="p-1.5 hover:bg-[#1a1a1a] rounded-lg text-[#888888] hover:text-white"><Minus className="w-4 h-4" /></button>
                         <button onClick={() => updateCartQty(item.plat.id, 1)} className="p-1.5 hover:bg-[#1a1a1a] rounded-lg text-[#888888] hover:text-white"><Plus className="w-4 h-4" /></button>
                         <button onClick={() => removeFromCart(item.plat.id)} className="p-1.5 hover:bg-error/10 rounded-lg text-[#888888] hover:text-error ml-2"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </motion.div>
                  ))}
               </AnimatePresence>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex-none p-8 bg-[#1a1a1a] border-t border-[#333333] space-y-8 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
            <div className="flex justify-between items-end">
               <span className="text-[10px] font-black text-[#888888] uppercase tracking-[0.2em]">Sous-total</span>
               <span className="font-mono text-3xl font-black text-white">{cartTotal.toFixed(0)} DH</span>
            </div>
            
            <button 
              onClick={handleSubmitOrder}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full h-20 bg-primary text-black rounded-xl font-sans text-xs font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-20 disabled:grayscale"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <Send className="w-5 h-5" />
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
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#121212] rounded-[3rem] border-2 border-[#333333] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-10 border-b border-[#333333] bg-[#1a1a1a] flex justify-between items-center">
                <div>
                  <h3 className="font-serif text-3xl font-black text-white uppercase tracking-widest italic">Encaisser Table {table?.numero}</h3>
                  <p className="text-[10px] font-black text-primary uppercase mt-2 tracking-[0.4em]">Total dû : {parseFloat(currentCommande?.montant_total || '0').toFixed(2)} DH</p>
                </div>
                <button onClick={() => setIsPayModalOpen(false)} className="p-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-full transition-colors text-white">
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="p-10">
                <AnimatePresence mode="wait">
                  {paymentStep === 'CHOICE' ? (
                    <motion.div 
                      key="choice" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                      className="grid grid-cols-1 gap-6"
                    >
                      <button 
                        onClick={() => handleManualPay('CASH')}
                        className="group flex items-center gap-8 p-8 bg-[#1a1a1a] border-2 border-[#333333] rounded-3xl hover:border-[#00e676]/40 hover:bg-[#00e676]/5 transition-all text-left"
                      >
                         <div className="w-16 h-16 rounded-2xl bg-[#00e676]/10 flex items-center justify-center text-[#00e676] group-hover:scale-110 transition-transform">
                            <Banknote className="w-10 h-10" />
                         </div>
                         <div>
                            <p className="text-base font-black text-white uppercase tracking-widest">Espèces / Cash</p>
                            <p className="text-[10px] font-bold text-[#888888] uppercase mt-2 tracking-widest">Règlement physique immédiat</p>
                         </div>
                      </button>

                      <button 
                        onClick={() => handleManualPay('CARD')}
                        className="group flex items-center gap-8 p-8 bg-[#1a1a1a] border-2 border-[#333333] rounded-3xl hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                      >
                         <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <CreditCard className="w-10 h-10" />
                         </div>
                         <div>
                            <p className="text-base font-black text-white uppercase tracking-widest">Carte Bancaire / TPE</p>
                            <p className="text-[10px] font-bold text-[#888888] uppercase mt-2 tracking-widest">Validation via terminal externe</p>
                         </div>
                      </button>

                      <div className="flex items-center gap-4 py-2">
                          <div className="h-px flex-1 bg-[#333333]" />
                          <span className="text-[9px] font-black text-[#444444] uppercase tracking-widest">OU</span>
                          <div className="h-px flex-1 bg-[#333333]" />
                      </div>

                      <button 
                        onClick={handleGenerateQr}
                        className="group flex items-center gap-8 p-8 bg-[#ffffff] border-2 border-transparent rounded-3xl hover:scale-[1.02] transition-all text-left"
                      >
                         <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                            <QrCode className="w-10 h-10" />
                         </div>
                         <div>
                            <p className="text-base font-black text-black uppercase tracking-widest">Paiement Mobile (QR)</p>
                            <p className="text-[10px] font-bold text-black/40 uppercase mt-2 tracking-widest">Lien sécurisé pour le client</p>
                         </div>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="qr" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col items-center text-center space-y-10"
                    >
                       <div className="p-10 bg-white rounded-[3rem] shadow-2xl border-4 border-white">
                          {qrData && (
                            <QRCodeSVG 
                                value={`${window.location.origin}${qrData.url}`}
                                size={240}
                                level="H"
                                includeMargin={false}
                                fgColor="#000000"
                            />
                          )}
                       </div>
                       
                       <div className="space-y-4">
                          <p className="font-serif text-2xl italic text-white">Veuillez présenter ce code au convive.</p>
                          <p className="text-[10px] font-black text-[#888888] uppercase tracking-[0.4em] leading-relaxed">
                            L'addition sera automatiquement soldée <br/> après règlement par le client.
                          </p>
                       </div>

                       <div className="w-full flex gap-6">
                          <button 
                            onClick={() => setPaymentStep('CHOICE')}
                            className="flex-1 h-16 border-2 border-[#333333] rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-[#1a1a1a] transition-all"
                          >
                             Retour
                          </button>
                          <a 
                            href={qrData?.url} target="_blank" rel="noreferrer"
                            className="flex-1 h-16 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
                          >
                             Ouvrir le lien <ExternalLink className="w-4 h-4" />
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
