import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { useConfigStore } from '../../store/configStore';
import { BrandWordmark, getBrandName } from '../../components/branding/BrandWordmark';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Users,
  ListOrdered,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const PaymentPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const config = useConfigStore(state => state.config);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            setError("Invalid or expired payment secure link.");
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
    setError(null);
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
    } catch (err: any) {
        setError(err.response?.data?.detail || "Payment authorization failed.");
    } finally {
        setIsPaying(false);
    }
  };

  if (isLoading) return <div className="min-h-[100dvh] flex items-center justify-center bg-background text-primary"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  if (error && !session) return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-6 md:p-8 text-center gap-8 md:gap-10">
          <div className="w-20 md:w-24 h-20 md:h-24 rounded-full bg-error-container/20 flex items-center justify-center text-error border-2 border-dashed border-error/20">
            <AlertCircle className="w-8 md:w-10 h-8 md:h-10" />
          </div>
          <div className="max-w-md">
            <h2 className="text-3xl md:text-4xl font-display-accent italic text-on-surface mb-3 md:mb-4">Secure Link Invalid</h2>
            <p className="text-sm md:text-on-surface-variant font-medium leading-relaxed">{error}</p>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="w-full sm:w-auto px-10 py-4 bg-on-surface text-white rounded-xl font-bold shadow-lg shadow-on-surface/10 hover:scale-105 active:scale-95 transition-all"
          >
            Return to Safety
          </button>
      </div>
  );

  if (isSuccess) return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-6 md:p-8 text-center animate-in zoom-in-95 duration-1000">
        <div className="relative inline-flex items-center justify-center mb-8 md:mb-12">
            <div className="absolute inset-0 bg-primary opacity-10 blur-3xl rounded-full scale-150" />
            <div className="relative w-24 md:w-32 h-24 md:h-32 rounded-full bg-white double-bezel flex items-center justify-center text-primary">
                <CheckCircle2 className="w-12 md:w-16 h-12 md:h-16" />
            </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-display-accent italic tracking-tight text-on-surface mb-4 md:mb-6">Payment Secured.</h1>
        <p className="text-lg md:text-xl text-on-surface-variant font-medium leading-relaxed max-w-md mb-8 md:mb-12">Thank you for your visit at {brandName}. We hope the culinary experience was architectural.</p>
        
        <div className="w-full max-w-md p-6 md:p-8 bg-white double-bezel flex flex-col gap-4 md:gap-6">
            <div className="flex justify-between items-center pb-4 border-b border-surface-container-high">
                <span className="text-[8px] md:text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-left">Authorized Amount</span>
                <span className="text-lg md:text-xl font-bold text-primary font-sans">{payableAmount} DH</span>
            </div>
            <div className="flex justify-between items-center opacity-60">
                <span className="text-[8px] md:text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-left">Remaining Session Balance</span>
                <span className="text-base md:text-lg font-bold text-on-surface font-sans">{(parseFloat(session.montant_restant) - parseFloat(payableAmount)).toFixed(2)} DH</span>
            </div>
        </div>
        
        <button 
            onClick={() => window.location.reload()} 
            className="mt-10 md:mt-12 text-primary font-bold uppercase text-[10px] md:text-xs tracking-[0.2em] border-b-2 border-primary/20 pb-1 hover:border-primary transition-all"
        >
            Authorize Another Payment
        </button>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-background p-5 md:p-8 flex flex-col items-center py-10 md:py-20 animate-in fade-in duration-700 overflow-x-hidden">
        <div className="w-full max-w-md flex flex-col gap-8 md:gap-10">
            <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-6 md:mb-8">
                    <div className="flex items-center justify-center w-10 md:w-12 h-10 md:h-12 rounded-xl bg-primary text-white font-bold text-xl md:text-2xl shadow-lg shadow-primary/20">
                        T
                    </div>
                    <BrandWordmark className="text-2xl md:text-3xl font-bold font-sans tracking-tight text-on-surface" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-primary text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-4 md:mb-6">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Secure Payment Protocol</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-display-accent italic tracking-tight text-on-surface mb-2 leading-tight">Session Settlement</h2>
                <p className="text-on-surface-variant font-medium opacity-60 uppercase text-[8px] md:text-[10px] tracking-[0.2em]">Table #{session.table_numero} • Balance: {session.montant_restant} DH</p>
            </div>

            <div className="double-bezel bg-white overflow-hidden flex flex-col">
                <div className="p-5 md:p-8 border-b border-surface-container-high bg-surface-container-lowest">
                    <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4 md:mb-6 text-center opacity-40">Select Distribution Protocol</p>
                    <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-1.5 rounded-xl md:rounded-2xl border border-surface-container-high">
                        <button onClick={() => setSplitMode('ALL')} className={`py-2.5 md:py-3 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${splitMode === 'ALL' ? 'bg-white shadow-lg md:shadow-xl text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>Total</button>
                        <button onClick={() => setSplitMode('EQUAL')} className={`py-2.5 md:py-3 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1 md:gap-2 ${splitMode === 'EQUAL' ? 'bg-white shadow-lg md:shadow-xl text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}><Users className="w-3 md:w-3.5 h-3 md:h-3.5"/> Equal</button>
                        <button onClick={() => setSplitMode('INDIVIDUAL')} className={`py-2.5 md:py-3 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1 md:gap-2 ${splitMode === 'INDIVIDUAL' ? 'bg-white shadow-lg md:shadow-xl text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}><ListOrdered className="w-3 md:w-3.5 h-3 md:h-3.5"/> Items</button>
                    </div>
                </div>

                <div className="p-5 md:p-8 flex-1">
                    {splitMode === 'EQUAL' && (
                        <div className="flex flex-col items-center gap-4 md:gap-6 mb-8 md:mb-10 animate-in slide-in-from-left-6 duration-500">
                            <label className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Partition Count</label>
                            <div className="flex items-center gap-8 md:gap-10 bg-surface-container-low rounded-xl md:rounded-2xl p-2 border border-surface-container-high">
                                <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="w-10 md:w-12 h-10 md:h-12 rounded-lg md:rounded-xl bg-white shadow-md md:shadow-lg text-on-surface font-bold text-lg md:text-xl hover:text-primary transition-all active:scale-75 cursor-default">—</button>
                                <span className="text-2xl md:text-3xl font-bold font-sans w-6 md:w-8 text-center text-on-surface">{splitCount}</span>
                                <button onClick={() => setSplitCount(splitCount + 1)} className="w-10 md:w-12 h-10 md:h-12 rounded-lg md:rounded-xl bg-white shadow-md md:shadow-lg text-on-surface font-bold text-lg md:text-xl hover:text-primary transition-all active:scale-75 cursor-default">+</button>
                            </div>
                        </div>
                    )}

                    {splitMode === 'INDIVIDUAL' && (
                        <div className="max-h-60 md:max-h-72 overflow-y-auto mb-8 md:mb-10 space-y-2 md:space-y-3 pr-2 animate-in slide-in-from-right-6 duration-500 scrollbar-hide">
                            <label className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-40 mb-2 md:mb-3 block ml-1">Individual Item Selection</label>
                            {session.lignes.filter((l: any) => parseFloat(l.montant_restant) > 0).map((l: any) => (
                                <button 
                                    key={l.id} 
                                    onClick={() => toggleItem(l.id)}
                                    className={`w-full flex items-center justify-between p-4 md:p-5 rounded-xl md:rounded-2xl border-2 transition-all duration-500 ${selectedItems.includes(l.id) ? 'bg-primary-container/10 border-primary shadow-md md:shadow-lg' : 'bg-surface-container-lowest border-surface-container-high hover:border-primary/20'}`}
                                >
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className={`w-5 md:w-6 h-5 md:h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedItems.includes(l.id) ? 'border-primary bg-primary text-white scale-110' : 'border-surface-container-highest bg-white'}`}>
                                            {selectedItems.includes(l.id) && <CheckCircle2 className="w-3 md:w-4 h-3 md:h-4" />}
                                        </div>
                                        <span className="text-xs md:text-sm font-bold text-on-surface font-sans text-left">{l.plat_nom}</span>
                                    </div>
                                    <span className="font-bold text-xs md:text-sm text-primary font-sans shrink-0">{l.montant_restant} DH</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col items-center justify-center py-8 md:py-10 border-y border-surface-container-high mb-8 md:mb-10">
                        <span className="text-on-surface-variant text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] mb-3 md:mb-4 opacity-40">Your Individual Allocation</span>
                        <div className="flex items-baseline gap-1 md:gap-2">
                            <span className="text-4xl md:text-6xl font-bold font-sans tracking-tighter text-on-surface">{payableAmount}</span>
                            <span className="text-lg md:text-xl font-bold text-primary font-sans">DH</span>
                        </div>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                        {error && <p className="text-error text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-center bg-error-container/20 py-2.5 md:py-3 rounded-lg md:rounded-xl animate-in shake duration-500">{error}</p>}
                        
                        <button 
                            onClick={() => handlePay()}
                            disabled={isPaying || parseFloat(payableAmount) <= 0}
                            className="w-full flex items-center justify-between p-4 md:p-6 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[2rem] hover:border-primary hover:bg-white transition-all duration-500 group disabled:opacity-40 shadow-sm"
                        >
                            <div className="flex items-center gap-4 md:gap-5">
                                <div className="w-10 md:w-14 h-10 md:h-14 bg-white rounded-xl md:rounded-2xl border border-surface-container-high flex items-center justify-center group-hover:scale-110 group-hover:shadow-md md:group-hover:shadow-xl transition-all duration-500">
                                    <Smartphone className="w-5 md:w-7 h-5 md:h-7 text-primary" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs md:text-sm font-bold text-on-surface uppercase tracking-widest">Apple / Google Pay</p>
                                    <p className="text-[8px] md:text-[10px] text-on-surface-variant opacity-60 font-medium">One-tap biometric auth</p>
                                </div>
                            </div>
                            <ArrowRight className="hidden md:block w-6 h-6 text-on-surface-variant opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                        </button>

                        <button 
                            onClick={() => handlePay()}
                            disabled={isPaying || parseFloat(payableAmount) <= 0}
                            className="w-full flex items-center justify-between p-4 md:p-6 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[2rem] hover:border-primary hover:bg-white transition-all duration-500 group disabled:opacity-40 shadow-sm"
                        >
                            <div className="flex items-center gap-4 md:gap-5">
                                <div className="w-10 md:w-14 h-10 md:h-14 bg-white rounded-xl md:rounded-2xl border border-surface-container-high flex items-center justify-center group-hover:scale-110 group-hover:shadow-md md:group-hover:shadow-xl transition-all duration-500">
                                    <CreditCard className="w-5 md:w-7 h-5 md:h-7 text-primary" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs md:text-sm font-bold text-on-surface uppercase tracking-widest">Debit / Credit Card</p>
                                    <p className="text-[8px] md:text-[10px] text-on-surface-variant opacity-60 font-medium">Encrypted terminal relay</p>
                                </div>
                            </div>
                            <ArrowRight className="hidden md:block w-6 h-6 text-on-surface-variant opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-center gap-2 md:gap-3 opacity-30 mt-4">
                <ShieldCheck className="w-3 md:w-4 h-3 md:h-4" />
                <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-[0.3em]">End-to-End Cryptographic Security Hub</span>
            </div>
        </div>
    </div>
  );
};
