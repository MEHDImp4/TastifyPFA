import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  QrCode
} from 'lucide-react';

export const PaymentPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [commande, setCommande] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchCmd = async () => {
        try {
            // Simplified: in real app we might fetch by payment token
            const res = await api.get(`/commandes/by_token/?token=${token}`);
            setCommande(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    if (token) fetchCmd();
  }, [token]);

  const handlePay = async () => {
    setIsPaying(true);
    setTimeout(() => {
        setIsPaying(false);
        setIsSuccess(true);
    }, 2000);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 animate-spin text-teal" /></div>;

  if (isSuccess) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-teal text-white rounded-full flex items-center justify-center mb-8 shadow-xl shadow-teal/20">
            <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-dark mb-2">Paiement réussi</h1>
        <p className="text-gray-500 mb-12">Merci de votre visite chez Tastify !</p>
        <div className="w-full max-w-sm p-6 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col gap-3">
            <div className="flex justify-between text-sm">
                <span className="text-gray-400">Référence</span>
                <span className="font-mono font-bold text-dark">#PAY-982{token?.slice(0,4)}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-400">Montant</span>
                <span className="font-bold text-teal">{commande?.montant_total || '0.00'} DH</span>
            </div>
        </div>
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
                <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-bold">Table #{commande?.table_numero || '?'}</p>
            </div>

            <div className="p-8 space-y-8">
                <div className="flex flex-col items-center justify-center py-4 border-b border-gray-100">
                    <span className="text-gray-400 text-sm mb-1 font-medium">Montant à régler</span>
                    <span className="text-5xl font-bold font-mono tracking-tighter text-dark">{commande?.montant_total || '0.00'}<span className="text-2xl ml-2">DH</span></span>
                </div>

                <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 text-center">Moyen de paiement</p>
                    <button 
                        onClick={handlePay}
                        disabled={isPaying}
                        className="w-full flex items-center justify-between p-5 bg-gray-50 border border-gray-200 rounded-3xl hover:border-teal transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl border border-gray-100 group-hover:scale-110 transition-transform">
                                <Smartphone className="w-6 h-6 text-teal" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-dark">Apple / Google Pay</p>
                                <p className="text-[10px] text-gray-400 font-medium">Paiement sans contact</p>
                            </div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-gray-200 group-hover:text-teal" />
                    </button>

                    <button 
                        onClick={handlePay}
                        disabled={isPaying}
                        className="w-full flex items-center justify-between p-5 bg-gray-50 border border-gray-200 rounded-3xl hover:border-teal transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl border border-gray-100 group-hover:scale-110 transition-transform">
                                <CreditCard className="w-6 h-6 text-orange" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-dark">Carte Bancaire</p>
                                <p className="text-[10px] text-gray-400 font-medium">Visa, Mastercard, CMI</p>
                            </div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-gray-200 group-hover:text-teal" />
                    </button>
                </div>
            </div>

            <div className="p-8 pt-0">
                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                    Paiement sécurisé par Tastify Pay.<br/>Aucune donnée bancaire n'est stockée sur nos serveurs.
                </p>
            </div>
        </div>
        
        <button className="mt-8 flex items-center gap-2 text-gray-400 font-medium hover:text-dark transition-colors">
            <AlertCircle className="w-4 h-4" />
            <span>Besoin d'aide ?</span>
        </button>
    </div>
  );
};
