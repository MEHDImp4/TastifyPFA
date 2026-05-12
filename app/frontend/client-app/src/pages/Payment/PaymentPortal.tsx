import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  QrCode,
  Users,
  ListOrdered
} from 'lucide-react';

export const PaymentPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
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

  useEffect(() => {
    const fetchSession = async () => {
        try {
            const res = await api.get(`/paiements/session/resolve/?token=${token}`);
            setSession(res.data);
            setPayableAmount(res.data.montant_restant);
        } catch (err) {
            console.error(err);
            setError("Lien de paiement invalide ou expiré.");
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
        } else if (splitMode === 'EQUAL') {
            // Backend will auto-distribute equal shares if contributions array is empty but we should ideally pass it if backend requires.
            // Wait, manual payment needs contributions if item-split. For equal, the backend auto-distributes in `create_payment` if no contributions.
        }

        await api.post(`/paiements/session/pay/`, payload);
        setIsSuccess(true);
    } catch (err: any) {
        setError(err.response?.data?.detail || "Erreur de paiement.");
    } finally {
        setIsPaying(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 animate-spin text-teal" /></div>;

  if (error && !session) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
          <AlertCircle className="w-16 h-16 text-terracotta mb-4" />
          <p className="text-gray-500">{error}</p>
          <button onClick={() => navigate('/')} className="mt-8 px-6 py-2 bg-dark text-white rounded-xl">Retour à l'accueil</button>
      </div>
  );

  if (isSuccess) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-teal text-white rounded-full flex items-center justify-center mb-8 shadow-xl shadow-teal/20">
            <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-dark mb-2">Paiement réussi</h1>
        <p className="text-gray-500 mb-12">Merci de votre visite chez Tastify !</p>
        <div className="w-full max-w-sm p-6 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col gap-3">
            <div className="flex justify-between text-sm">
                <span className="text-gray-400">Montant payé</span>
                <span className="font-bold text-teal">{payableAmount} DH</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-400">Reste à payer (Table)</span>
                <span className="font-bold text-dark">{(parseFloat(session.montant_restant) - parseFloat(payableAmount)).toFixed(2)} DH</span>
            </div>
        </div>
        <button onClick={() => window.location.reload()} className="mt-8 text-teal font-bold hover:underline">Effectuer un autre paiement</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center py-12">
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-xl overflow-hidden border border-gray-100">
            <div className="p-8 bg-dark text-white text-center">
                <div className="w-12 h-12 bg-teal/10 rounded-2xl flex items-center justify-center text-teal mx-auto mb-4">
                    <QrCode className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Règlement de votre table</h2>
                <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-bold">Table #{session.table_numero} • Reste: {session.montant_restant} DH</p>
            </div>

            <div className="p-6 border-b border-gray-100">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 text-center">Comment voulez-vous payer ?</p>
                <div className="grid grid-cols-3 gap-2 bg-gray-50 p-1.5 rounded-2xl">
                    <button onClick={() => setSplitMode('ALL')} className={`py-2 rounded-xl text-xs font-bold transition-all ${splitMode === 'ALL' ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:text-dark'}`}>Total</button>
                    <button onClick={() => setSplitMode('EQUAL')} className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${splitMode === 'EQUAL' ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:text-dark'}`}><Users className="w-3 h-3"/> Égal</button>
                    <button onClick={() => setSplitMode('INDIVIDUAL')} className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${splitMode === 'INDIVIDUAL' ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:text-dark'}`}><ListOrdered className="w-3 h-3"/> Article</button>
                </div>
            </div>

            <div className="p-6">
                {splitMode === 'EQUAL' && (
                    <div className="flex flex-col items-center gap-4 mb-6 animate-in slide-in-from-left-4">
                        <label className="text-sm text-gray-500">Diviser par combien de personnes ?</label>
                        <div className="flex items-center gap-6 bg-gray-50 rounded-2xl p-2 border border-gray-200">
                            <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="w-10 h-10 rounded-xl bg-white shadow-sm text-dark font-bold text-lg hover:text-teal">-</button>
                            <span className="text-2xl font-bold font-mono w-8 text-center">{splitCount}</span>
                            <button onClick={() => setSplitCount(splitCount + 1)} className="w-10 h-10 rounded-xl bg-white shadow-sm text-dark font-bold text-lg hover:text-teal">+</button>
                        </div>
                    </div>
                )}

                {splitMode === 'INDIVIDUAL' && (
                    <div className="max-h-60 overflow-y-auto mb-6 space-y-2 pr-2 animate-in slide-in-from-right-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Vos consommations</label>
                        {session.lignes.filter((l: any) => parseFloat(l.montant_restant) > 0).map((l: any) => (
                            <button 
                                key={l.id} 
                                onClick={() => toggleItem(l.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedItems.includes(l.id) ? 'bg-teal/5 border-teal/30' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedItems.includes(l.id) ? 'border-teal bg-teal text-white' : 'border-gray-300 bg-white'}`}>
                                        {selectedItems.includes(l.id) && <CheckCircle2 className="w-3 h-3" />}
                                    </div>
                                    <span className="text-sm font-bold text-dark">{l.plat_nom} x{l.quantite}</span>
                                </div>
                                <span className="font-mono text-sm text-teal font-bold">{l.montant_restant} DH</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex flex-col items-center justify-center py-6 border-y border-gray-100 mb-6">
                    <span className="text-gray-400 text-sm mb-1 font-medium">Votre part à régler</span>
                    <span className="text-5xl font-bold font-mono tracking-tighter text-dark">{payableAmount}<span className="text-2xl ml-2">DH</span></span>
                </div>

                <div className="space-y-4">
                    {error && <p className="text-terracotta text-sm text-center font-medium bg-terracotta/10 py-2 rounded-lg">{error}</p>}
                    <button 
                        onClick={() => handlePay()}
                        disabled={isPaying || parseFloat(payableAmount) <= 0}
                        className="w-full flex items-center justify-between p-5 bg-gray-50 border border-gray-200 rounded-3xl hover:border-teal transition-all group disabled:opacity-50"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl border border-gray-100 group-hover:scale-110 transition-transform">
                                <Smartphone className="w-6 h-6 text-teal" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-dark">Apple / Google Pay</p>
                            </div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-gray-200 group-hover:text-teal" />
                    </button>

                    <button 
                        onClick={() => handlePay()}
                        disabled={isPaying || parseFloat(payableAmount) <= 0}
                        className="w-full flex items-center justify-between p-5 bg-gray-50 border border-gray-200 rounded-3xl hover:border-teal transition-all group disabled:opacity-50"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl border border-gray-100 group-hover:scale-110 transition-transform">
                                <CreditCard className="w-6 h-6 text-orange" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-dark">Carte Bancaire</p>
                            </div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-gray-200 group-hover:text-teal" />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
