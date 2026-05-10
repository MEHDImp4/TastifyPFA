import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api/axios';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  PackageCheck
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { items, updateQty, removeItem, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const total = items.reduce((sum, item) => sum + (parseFloat(item.plat.prix) * item.quantite), 0);

  const handleOrder = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/commandes/', {
        type: 'EMPORTER',
        lignes: items.map(i => ({
          plat: i.plat.id,
          quantite: i.quantite,
          notes: ''
        }))
      });
      setIsSuccess(true);
      clearCart();
    } catch (err: any) {
      setError("Erreur lors de la commande. Veuillez vérifier votre connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-teal/10 rounded-full flex items-center justify-center text-teal mb-8">
            <PackageCheck className="w-12 h-12" />
        </div>
        <h2 className="text-4xl font-bold text-dark mb-4">Commande reçue !</h2>
        <p className="text-lg text-gray-500 max-w-sm mb-12">Nos chefs commencent la préparation. Vous recevrez une notification quand elle sera prête.</p>
        <button onClick={() => navigate('/account')} className="px-10 py-4 bg-dark text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Suivre ma commande</button>
    </div>
  );

  if (items.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center py-24 gap-6">
        <div className="p-10 bg-gray-50 rounded-full border-2 border-dashed border-gray-100 text-gray-300">
            <ShoppingBag className="w-16 h-16" />
        </div>
        <h2 className="text-2xl font-bold text-dark">Votre panier est vide</h2>
        <button onClick={() => navigate('/menu')} className="px-8 py-3 bg-teal text-white rounded-2xl font-bold shadow-lg shadow-teal/20">Explorer le menu</button>
    </div>
  );

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 md:py-20 animate-in fade-in duration-500">
        <h1 className="text-4xl font-bold tracking-tight text-dark mb-12 flex items-center gap-4">
            <ShoppingBag className="w-8 h-8 text-teal" />
            Votre Panier
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-4">
                {items.map(item => (
                    <div key={item.plat.id} className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-50 shrink-0">
                            {item.plat.image ? (
                                <img src={item.plat.image} className="w-full h-full object-cover" alt={item.plat.nom} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200 font-bold text-2xl uppercase">
                                    {item.plat.nom.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-dark truncate">{item.plat.nom}</h3>
                            <p className="text-teal font-mono font-bold">{item.plat.prix} DH</p>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1 px-3">
                            <button onClick={() => updateQty(item.plat.id, -1)} className="p-1 text-teal"><Minus className="w-4 h-4" /></button>
                            <span className="font-mono font-bold w-6 text-center">{item.quantite}</span>
                            <button onClick={() => updateQty(item.plat.id, 1)} className="p-1 text-teal"><Plus className="w-4 h-4" /></button>
                        </div>
                        <button onClick={() => removeItem(item.plat.id)} className="p-2 text-gray-400 hover:text-terracotta transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                ))}
            </div>

            <div className="space-y-6">
                <div className="p-8 bg-dark text-white rounded-[2.5rem] shadow-2xl border border-white/5">
                    <h3 className="text-xl font-bold mb-8">Récapitulatif</h3>
                    <div className="space-y-4 mb-10">
                        <div className="flex justify-between text-gray-400">
                            <span>Sous-total</span>
                            <span className="font-mono">{total.toFixed(2)} DH</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Frais de service</span>
                            <span className="text-teal font-bold uppercase text-[10px] tracking-widest bg-teal/10 px-2 py-1 rounded">Offert</span>
                        </div>
                        <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                            <span className="text-lg font-bold">Total</span>
                            <span className="text-3xl font-bold font-mono tracking-tighter text-teal">{total.toFixed(2)} DH</span>
                        </div>
                    </div>

                    {error && <p className="text-terracotta text-sm text-center mb-4">{error}</p>}

                    <button 
                        onClick={handleOrder}
                        disabled={isSubmitting}
                        className="w-full py-4 bg-teal text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-teal/20"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <span>Commander à emporter</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
                <p className="text-xs text-gray-400 text-center px-4 leading-relaxed">
                    En validant, vous acceptez nos conditions générales. Le paiement se fera lors du retrait.
                </p>
            </div>
        </div>
    </div>
  );
};
