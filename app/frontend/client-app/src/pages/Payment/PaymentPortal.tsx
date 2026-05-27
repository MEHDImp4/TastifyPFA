import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { useConfigStore } from '../../store/configStore';
import { getBrandName } from '../../components/branding/brandName';
import { 
  CheckCircle2, 
  Loader2, 
  ListOrdered,
  ArrowRight,
  ShieldCheck,
  QrCode,
  PieChart,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const PaymentPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const config = useConfigStore(state => state.config);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Split logic state
  const [splitMode, setSplitMode] = useState<'ALL' | 'EQUAL' | 'INDIVIDUAL'>('ALL');
  const [splitCount, setSplitCount] = useState(2);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [payableAmount, setPayableAmount] = useState('0.00');
  const brandName = getBrandName(config?.nom);

  useEffect(() => {
    const fetchSession = async () => {
        try {
            const res = await api.get(`/paiements/session/resolve/?token=${token}`);
            setSession(res.data);
            setPayableAmount(res.data.montant_restant);
        } catch (err) {
            console.error(err);
            toast.error("Invalid or expired secure link.");
        } finally {
            setIsLoading(false);
        }
    };
    if (token) fetchSession();
  }, [token]);

  useEffect(() => {
      if (!session) return;
      if (splitMode === 'ALL') {
          setPayableAmount(session.montant_restant);
      } else if (splitMode === 'EQUAL') {
          const check = async () => {
            try {
                const res = await api.post(`/paiements/session/equal-split/`, { token, split_count: splitCount });
                setPayableAmount(res.data.share_amount);
            } catch (e) {
                console.error(e);
            }
          };
          check();
      } else if (splitMode === 'INDIVIDUAL') {
          const total = session.lignes
            .filter((l: any) => selectedItems.includes(l.id))
            .reduce((sum: number, l: any) => sum + parseFloat(l.montant_restant), 0);
          setPayableAmount(total.toFixed(2));
      }
  }, [splitMode, splitCount, selectedItems, session, token]);

  const toggleItem = (id: number) => {
      setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handlePay = async () => {
    if (parseFloat(payableAmount) <= 0) return;
    setIsPaying(true);
    try {
        const payload: any = {
            token,
            montant: payableAmount,
            reference_transaction: `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
        };
        if (splitMode === 'INDIVIDUAL') {
            payload.contributions = session.lignes
                .filter((l: any) => selectedItems.includes(l.id))
                .map((l: any) => ({ ligne_id: l.id, montant: l.montant_restant }));
        }
        await api.post(`/paiements/session/pay/`, payload);
        setIsSuccess(true);
        toast.success('Authorization Successful');
    } catch (err: any) {
        toast.error(err.response?.data?.detail || "Authorization failed.");
    } finally {
        setIsPaying(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] relative overflow-hidden">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6 relative z-10"
        >
            <Loader2 className="w-12 h-12 animate-spin text-[#D14D1A]" strokeWidth={1.5}/>
            <span className="font-sans text-[9px] font-black text-[#2D2424]/40 uppercase tracking-[0.4em]">Initialisation du terminal de paiement</span>
        </motion.div>
        <div className="absolute inset-0 bg-[#C5A059]/5 blur-[100px] rounded-full" />
    </div>
  );

  if (isSuccess) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center animate-in zoom-in-95 duration-1000 font-body">
        <div className="w-full max-w-xl bg-surface-container border border-outline-variant rounded-[3rem] p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[80px] -mr-24 -mt-24" />
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-10" strokeWidth={1} />
            <h2 className="font-serif text-4xl font-black text-on-surface italic mb-4 leading-none lowercase">Payment Secured.</h2>
            <p className="text-lg text-on-surface-variant uppercase tracking-widest leading-relaxed mb-12">Thank you for your visit at {brandName}. Your session has been successfully settled.</p>
            <button onClick={() => navigate('/')} className="px-16 py-6 bg-on-surface text-background rounded-2xl font-sans text-xs font-black uppercase tracking-[0.4em] transition-all hover:bg-primary cinematic-shadow">Return Home</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-body selection:bg-primary/20 flex flex-col items-center py-12 md:py-24 px-6 overflow-x-hidden">
        <main className="w-full max-w-2xl flex flex-col gap-12">
            
            {/* Header Section */}
            <div className="text-center space-y-4">
                <span className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.4em]">Table {session.table_numero || '00'} • Settlement</span>
                <h1 className="font-serif text-4xl md:text-6xl font-black text-on-surface italic leading-none m-0">Your Bill</h1>
                <div
                  className="text-5xl md:text-7xl font-sans font-black text-primary tracking-tighter tabular-nums mt-6"
                  data-testid="payment-session-total"
                >
                  {session.montant_restant} DH
                </div>
                <p className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Includes automated service fees</p>
            </div>

            {/* Split Options Bento */}
            <div className="grid grid-cols-3 gap-4">
                <button onClick={() => setSplitMode('ALL')} className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${splitMode === 'ALL' ? 'bg-primary border-primary text-on-primary shadow-xl scale-105' : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-primary/50'}`}>
                   <Receipt className="w-5 h-5" />
                   <span className="font-sans text-[10px] font-black uppercase tracking-widest">Pay All</span>
                </button>
                <button onClick={() => setSplitMode('EQUAL')} className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${splitMode === 'EQUAL' ? 'bg-primary border-primary text-on-primary shadow-xl scale-105' : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-primary/50'}`}>
                   <PieChart className="w-5 h-5" />
                   <span className="font-sans text-[10px] font-black uppercase tracking-widest">Split</span>
                </button>
                <button onClick={() => setSplitMode('INDIVIDUAL')} className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${splitMode === 'INDIVIDUAL' ? 'bg-primary border-primary text-on-primary shadow-xl scale-105' : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-primary/50'}`}>
                   <ListOrdered className="w-5 h-5" />
                   <span className="font-sans text-[10px] font-black uppercase tracking-widest">Items</span>
                </button>
            </div>

            <AnimatePresence mode="wait">
                {splitMode === 'INDIVIDUAL' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-surface-container border border-outline-variant rounded-[2rem] p-8 space-y-6">
                        <label className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Itemized Breakdown</label>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                           {session.lignes.map((l: any) => (
                               <button 
                                 key={l.id} onClick={() => toggleItem(l.id)}
                                 className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${selectedItems.includes(l.id) ? 'bg-primary/10 border-primary text-on-surface' : 'bg-surface-container-lowest border-outline-variant/20 text-on-surface-variant'}`}
                               >
                                  <div className="text-left">
                                     <span className="font-sans text-[13px] font-black uppercase block tracking-tight">{l.plat_nom}</span>
                                     <span className="font-mono text-[10px] text-on-surface-variant uppercase">Qty {l.quantite}</span>
                                  </div>
                                  <span className="font-sans font-bold text-primary">{l.montant_restant} DH</span>
                               </button>
                           ))}
                        </div>
                    </motion.div>
                )}
                {splitMode === 'EQUAL' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-surface-container border border-outline-variant rounded-[2rem] p-10 flex flex-col items-center gap-6">
                       <label className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Partition Count</label>
                       <div className="flex items-center gap-12 bg-surface-container-lowest rounded-full p-3 border border-outline-variant/30">
                          <button aria-label="Decrease split count" onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-on-surface hover:text-background transition-all">
                            <span aria-hidden="true">—</span>
                            <span className="sr-only">Decrease split count</span>
                          </button>
                          <span className="font-serif text-5xl font-black italic text-on-surface">{splitCount}</span>
                          <button aria-label="Increase split count" onClick={() => setSplitCount(splitCount + 1)} className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-on-surface hover:text-background transition-all">
                            <span aria-hidden="true">+</span>
                            <span className="sr-only">Increase split count</span>
                          </button>
                       </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action / QR Section */}
            <div className="bg-surface-container-low border border-outline-variant rounded-[2.5rem] p-10 flex flex-col items-center gap-8 shadow-sm">
                <div className="text-center space-y-2">
                   <p className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Authorize Individual Allocation</p>
                   <p className="font-sans text-3xl font-black text-on-surface tabular-nums" data-testid="payment-payable-amount">{payableAmount} DH</p>
                </div>
                
                <div className="p-6 bg-primary/5 rounded-3xl border-2 border-primary/20 shadow-inner group cursor-pointer hover:border-primary transition-all">
                   <QrCode className="w-40 h-40 text-primary stroke-[1] group-hover:scale-105 transition-all duration-700" />
                </div>
                
                <p className="font-body text-[14px] text-on-surface-variant italic max-w-xs text-center uppercase tracking-tight">Scan for secure biometric authorization via Apple Pay or Google Pay</p>
                
                <div className="w-full space-y-4">
                    <button 
                        onClick={handlePay} disabled={isPaying || parseFloat(payableAmount) <= 0}
                        className="w-full py-6 bg-primary text-on-primary rounded-2xl font-sans text-xs font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                    >
                        {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Confirm Payment</span><ArrowRight className="w-4 h-4" /></>}
                    </button>
                    <div className="flex items-center justify-center gap-2 opacity-20">
                       <ShieldCheck className="w-3 h-3" />
                       <span className="font-sans text-[8px] font-black uppercase tracking-[0.3em]">End-to-End Cryptographic Security Hub</span>
                    </div>
                </div>
            </div>
        </main>
    </div>
  );
};

