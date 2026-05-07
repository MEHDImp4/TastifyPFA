import React, { useState, useEffect } from 'react';
import { Modal } from '@shared/ui/Modal';
import axiosInstance from '@shared/auth/axiosInstance';
import { PaymentSession } from '@shared/types/paiements';
import { Loader2, QrCode, CreditCard, Banknote, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStaffWebSocket } from '@shared/websocket/WebSocketProvider';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: number;
  tableNumero: number;
  onPaymentSuccess?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  tableId,
  tableNumero,
  onPaymentSuccess
}) => {
  const { lastEvent } = useStaffWebSocket();
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [hasNoPayableOrder, setHasNoPayableOrder] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPaymentSession();
    } else {
      resetState();
    }
  }, [isOpen, tableId]);

  // WebSocket sync for real-time updates
  useEffect(() => {
    if (!isOpen || !session || !lastEvent) return;

    const isOurOrder = (lastEvent.payload as any)?.commande_id === session.commande_id || 
                      (lastEvent.payload as any)?.order?.id === session.commande_id;

    if (isOurOrder && (lastEvent.type === 'payment_confirmed' || lastEvent.type === 'order_updated')) {
      fetchPaymentSession();
    }
  }, [lastEvent, isOpen]);

  const resetState = () => {
    setSession(null);
    setQrToken(null);
    setShowQR(false);
    setError(null);
    setHasNoPayableOrder(false);
  };

  const fetchPaymentSession = async () => {
    setLoading(true);
    setError(null);
    setHasNoPayableOrder(false);
    try {
      await axiosInstance.get(`/tables/${tableId}/`);
      
      const sessionResponse = await axiosInstance.get(`/paiements/session/staff-resolve/?table_id=${tableId}`);
      setSession(sessionResponse.data);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string' && detail.includes('No payable order found')) {
        setHasNoPayableOrder(true);
        onPaymentSuccess?.();
        return;
      }
      setError(detail || "Impossible de charger la session de paiement.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualPayment = async (method: 'ESPECES' | 'CARTE') => {
    if (!session) return;
    setProcessing(true);
    setError(null);
    try {
      await axiosInstance.post('/paiements/', {
        commande: session.commande_id,
        montant: session.montant_restant,
        methode: method
      });
      onPaymentSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du traitement du paiement.");
    } finally {
      setProcessing(false);
    }
  };

  const generateQR = async () => {
    setProcessing(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/tables/${tableId}/qr/`);
      setQrToken(response.data.token);
      setShowQR(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de la génération du QR Code.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Règlement - Table ${tableNumero}`}>
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center py-12 gap-4">
            <Loader2 className="w-8 h-8 text-teal animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted">Calcul de l'addition...</p>
          </div>
        ) : hasNoPayableOrder ? (
          <div className="bg-surface-elevated border border-white/5 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-teal mx-auto" />
            <p className="text-sm font-bold text-white leading-relaxed">
              Cette table n&apos;a plus de commande a encaisser.
            </p>
            <button
              onClick={onClose}
              className="text-[10px] font-black uppercase tracking-widest text-white bg-teal px-4 py-2 rounded-lg"
            >
              Fermer
            </button>
          </div>
        ) : error ? (
          <div className="bg-error/5 border border-error/10 rounded-2xl p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-error mx-auto" />
            <p className="text-sm font-bold text-error leading-relaxed">{error}</p>
            <button 
              onClick={fetchPaymentSession}
              className="text-[10px] font-black uppercase tracking-widest text-white bg-error px-4 py-2 rounded-lg"
            >
              Réessayer
            </button>
          </div>
        ) : session ? (
          <div className="space-y-6 animate-enter">
            <div className="bg-surface-elevated rounded-2xl p-6 border border-white/5 space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted">Total à payer</span>
                <span className="text-4xl font-black text-white tracking-tighter tabular-nums">
                  {session.montant_restant} <span className="text-lg text-teal">DH</span>
                </span>
              </div>
              
              <div className="pt-4 border-t border-white/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground-muted">Montant de la commande</span>
                  <span className="font-bold text-white">{session.montant_total} DH</span>
                </div>
                {session.montant_paye > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-teal font-bold">Déjà payé</span>
                    <span className="font-bold text-teal">-{session.montant_paye} DH</span>
                  </div>
                )}
              </div>
            </div>

            {showQR && qrToken ? (
              <div className="flex flex-col items-center p-6 bg-white rounded-2xl animate-enter">
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl mb-4 relative">
                  <QrCode className="w-12 h-12 text-gray-400" />
                  <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                    <p className="text-[10px] font-black text-surface text-center px-4 leading-tight uppercase tracking-widest">
                      QR Code de Paiement Généré
                    </p>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-surface-elevated uppercase tracking-widest text-center opacity-60">
                  Le client peut scanner ce code <br/> pour payer en autonomie
                </p>
                <button 
                  onClick={() => setShowQR(false)}
                  className="mt-4 text-[10px] font-black text-teal uppercase tracking-widest hover:underline"
                >
                  Choisir une autre méthode
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <button
                  disabled={processing}
                  onClick={() => handleManualPayment('ESPECES')}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-surface hover:bg-surface-elevated transition-all active:scale-95 disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-teal" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white leading-none">Espèces</p>
                      <p className="text-[10px] text-foreground-muted mt-1 font-medium">Encaissement manuel</p>
                    </div>
                  </div>
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-white/10" />}
                </button>

                <button
                  disabled={processing}
                  onClick={() => handleManualPayment('CARTE')}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-surface hover:bg-surface-elevated transition-all active:scale-95 disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#2A9D8F]/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-[#2A9D8F]" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white leading-none">Carte Bancaire</p>
                      <p className="text-[10px] text-foreground-muted mt-1 font-medium">Terminal de paiement</p>
                    </div>
                  </div>
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-white/10" />}
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black text-foreground-muted/40 bg-surface px-2">Ou</div>
                </div>

                <button
                  disabled={processing}
                  onClick={generateQR}
                  className="flex items-center justify-between p-4 rounded-xl border border-teal/20 bg-teal/5 hover:bg-teal/10 transition-all active:scale-95 disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-teal flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-teal leading-none">Self-Service QR</p>
                      <p className="text-[10px] text-teal/60 mt-1 font-medium">Le client paie sur son mobile</p>
                    </div>
                  </div>
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 text-teal" />}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Modal>
  );
};

const ArrowRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
