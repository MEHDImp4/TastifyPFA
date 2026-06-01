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
  PieChart,
  Receipt,
  QrCode
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
            toast.error("Lien sécurisé invalide ou expiré.");
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
        toast.success('Autorisation Réussie');
    } catch (err: any) {
        toast.error(err.response?.data?.detail || "L'autorisation a échoué.");
    } finally {
        setIsPaying(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
        <div className="flex flex-col items-center gap-6 relative z-10">
            <Loader2 className="w-12 h-12 animate-spin text-on-background" strokeWidth={1}/>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.4em]">Initialisation du terminal de paiement</span>
        </div>
    </div>
  );

  if (isSuccess) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center font-body">
        <div className="w-full max-w-xl atelier-card p-12 relative overflow-hidden">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-10" strokeWidth={1} />
            <h2 className="text-4xl font-bold text-on-surface mb-4 leading-none">Paiement Sécurisé. <span className="sr-only">Payment Secured.</span></h2>
            <p className="text-lg text-on-surface-variant uppercase tracking-widest leading-relaxed mb-12">Merci de votre visite chez {brandName}. Votre session a été réglée avec succès.</p>
            <button onClick={() => navigate('/')} className="btn-primary mx-auto w-fit px-16 h-14">Retour à l'Accueil</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-body selection:bg-on-background/10 flex flex-col items-center py-12 md:py-24 px-6 overflow-x-hidden">
        <main className="w-full max-w-2xl flex flex-col gap-12">
            
            {/* Header Section */}
            <div className="text-center space-y-4">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.4em]">Table {session.table_numero || '00'} • Règlement</span>
                <h1 className="text-4xl md:text-6xl font-bold text-on-surface leading-none m-0 uppercase tracking-tight">Votre Addition</h1>
                <div
                  className="text-5xl md:text-7xl font-mono font-bold text-on-background tracking-tighter tabular-nums mt-6"
                  data-testid="payment-session-total"
                >
                  {session.montant_restant} DH
                </div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">Inclut les frais de service automatisés</p>
            </div>

            {/* Split Options */}
            <div className="grid grid-cols-3 gap-4">
                <button onClick={() => setSplitMode('ALL')} className={`p-6 rounded-lg border-2 flex flex-col items-center justify-center gap-3 transition-all ${splitMode === 'ALL' ? 'bg-on-background border-on-background text-background' : 'bg-surface border-outline text-on-surface-variant hover:border-on-background'}`}>
                   <Receipt className="w-5 h-5" strokeWidth={1.5}/>
                   <span className="text-[10px] font-bold uppercase tracking-widest">Tout Régler</span>
                </button>
                <button onClick={() => setSplitMode('EQUAL')} className={`p-6 rounded-lg border-2 flex flex-col items-center justify-center gap-3 transition-all ${splitMode === 'EQUAL' ? 'bg-on-background border-on-background text-background' : 'bg-surface border-outline text-on-surface-variant hover:border-on-background'}`}>
                   <PieChart className="w-5 h-5" strokeWidth={1.5}/>
                   <span className="text-[10px] font-bold uppercase tracking-widest">Partager</span>
                </button>
                <button onClick={() => setSplitMode('INDIVIDUAL')} className={`p-6 rounded-lg border-2 flex flex-col items-center justify-center gap-3 transition-all ${splitMode === 'INDIVIDUAL' ? 'bg-on-background border-on-background text-background' : 'bg-surface border-outline text-on-surface-variant hover:border-on-background'}`}>
                   <ListOrdered className="w-5 h-5" strokeWidth={1.5}/>
                   <span className="text-[10px] font-bold uppercase tracking-widest">Par Article</span>
                </button>
            </div>

            {splitMode === 'INDIVIDUAL' && (
                <div className="atelier-card p-8 space-y-6">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Détail par Article</label>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {session.lignes.map((l: any) => (
                            <button 
                                key={l.id} onClick={() => toggleItem(l.id)}
                                className={`w-full p-4 rounded border flex items-center justify-between transition-all ${selectedItems.includes(l.id) ? 'bg-on-background text-background border-on-background' : 'bg-background border-outline text-on-surface-variant'}`}
                            >
                                <div className="text-left">
                                    <span className="text-[13px] font-bold uppercase block tracking-tight">{l.plat_nom}</span>
                                    <span className="font-mono text-[10px] opacity-40 uppercase">Qté {l.quantite}</span>
                                </div>
                                <span className="font-mono font-bold">{l.montant_restant} DH</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {splitMode === 'EQUAL' && (
                <div className="atelier-card p-10 flex flex-col items-center gap-6">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nombre de Parts</label>
                    <div className="flex items-center gap-12 bg-background rounded-md p-3 border border-outline">
                        <button aria-label="Diminuer le nombre de parts" onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="w-12 h-12 rounded bg-surface border border-outline flex items-center justify-center hover:bg-on-background hover:text-background transition-all">
                        <span aria-hidden="true">—</span>
                        <span className="sr-only">Diminuer le nombre de parts</span>
                        </button>
                        <span className="text-5xl font-bold text-on-background">{splitCount}</span>
                        <button aria-label="Augmenter le nombre de parts" onClick={() => setSplitCount(splitCount + 1)} className="w-12 h-12 rounded bg-surface border border-outline flex items-center justify-center hover:bg-on-background hover:text-background transition-all">
                        <span aria-hidden="true">+</span>
                        <span className="sr-only">Augmenter le nombre de parts</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Action / QR Section */}
            <div className="atelier-card p-10 flex flex-col items-center gap-8 shadow-sm">
                <div className="text-center space-y-2">
                   <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Autoriser l'Allocation Individuelle</p>
                   <p className="font-mono text-3xl font-bold text-on-background tabular-nums" data-testid="payment-payable-amount">{payableAmount} DH</p>
                </div>
                
                <div className="p-6 bg-surface-container-high rounded-xl border border-outline shadow-inner group cursor-pointer">
                   <QrCode className="w-40 h-40 text-on-background stroke-[1] group-hover:scale-105 transition-all duration-700" />
                </div>
                
                <p className="text-[14px] text-on-surface-variant max-w-xs text-center uppercase tracking-tight opacity-40">Scannez pour une autorisation biométrique sécurisée via Apple Pay ou Google Pay</p>
                
                <div className="w-full space-y-4">
                    <button 
                        onClick={handlePay} disabled={isPaying || parseFloat(payableAmount) <= 0}
                        className="btn-primary w-full h-16 uppercase tracking-[0.4em] gap-4"
                    >
                        {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Confirmer le Règlement</span><span className="sr-only">Confirm Payment</span><ArrowRight className="w-4 h-4" /></>}
                    </button>
                    <div className="flex items-center justify-center gap-2 opacity-20">
                       <ShieldCheck className="w-3 h-3" />
                       <span className="text-[8px] font-bold uppercase tracking-[0.3em]">Centre de Sécurité Cryptographique de Bout en Bout</span>
                    </div>
                </div>
            </div>
        </main>
    </div>
  );
};
