import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axiosInstance from '@shared/auth/axiosInstance'
import { PaymentSession } from '@shared/types/paiements'
import { SplitSelector } from '../../components/payment/SplitSelector'

export const PaymentLandingPage = () => {
  const { token } = useParams<{ token: string }>()
  const [session, setSession] = useState<PaymentSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [processing, setProcessing] = useState(false)
  
  const [selection, setSelection] = useState<{
    montant: number;
    contributions?: Array<{ commande_ligne_id: number; montant_contribue: number }>;
  } | null>(null)

  useEffect(() => {
    const resolveSession = async () => {
      try {
        const response = await axiosInstance.get('/paiements/session/resolve/', { 
          params: { token } 
        })
        setSession(response.data)
      } catch (err: any) {
        setError(err.response?.data?.detail || "Lien de paiement invalide ou expiré.")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      resolveSession()
    }
  }, [token])

  const handlePayment = async () => {
    if (!token || !selection || selection.montant <= 0) return;
    
    setProcessing(true);
    try {
      // Simulation d'une latence de paiement externe
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const payload = {
        token,
        montant: selection.montant,
        reference_transaction: `QR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        contributions: selection.contributions
      };

      await axiosInstance.post('/paiements/session/pay/', payload);
      setPaymentSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du traitement du paiement.")
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="animate-pulse text-teal font-semibold tracking-widest uppercase text-sm">Chargement...</div>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="mb-6 w-20 h-20 bg-teal/20 rounded-full flex items-center justify-center text-4xl text-teal shadow-[0_0_40px_rgba(42,157,143,0.3)]">
          ✓
        </div>
        <h1 className="mb-2 text-3xl font-bold">Merci !</h1>
        <p className="text-foreground-muted mb-8 max-w-xs">Votre paiement de <span className="text-foreground font-bold">{selection?.montant} MAD</span> a été accepté. Votre table a été libérée.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-8 py-3 bg-teal text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-teal/20"
        >
          Retour à l'accueil
        </button>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <h1 className="mb-2 text-xl font-bold text-terracotta">Oups !</h1>
        <p className="text-foreground-muted mb-6">{error}</p>
        {error && (
          <button 
            onClick={() => window.location.reload()}
            className="text-teal font-semibold underline"
          >
            Réessayer
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-surface/50 backdrop-blur-md sticky top-0 z-10">
        <span className="text-xs font-bold tracking-[0.2em] text-teal uppercase">Tastify Check-out</span>
        <div className="text-[10px] px-2 py-1 bg-white/5 rounded border border-white/10 text-foreground-muted uppercase">Table {session.table_id}</div>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full pb-32">
        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-6 tracking-tight">Réglage de la note</h2>

          <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden mb-8 shadow-xl">
            <div className="p-6 bg-white/[0.02]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-foreground-muted text-sm">Total de la commande</span>
                <span className="font-medium">{session.montant_total} MAD</span>
              </div>
              {session.montant_paye > 0 && (
                <div className="flex justify-between items-center mb-3 text-teal text-sm">
                  <span>Déjà payé</span>
                  <span className="font-medium">-{session.montant_paye} MAD</span>
                </div>
              )}
              <div className="border-t border-white/5 my-4 pt-4 flex justify-between items-center">
                <span className="font-bold text-lg text-amber">Reste à payer</span>
                <span className="font-bold text-2xl text-amber">{session.montant_restant} MAD</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground-muted mb-4 px-1">Options de partage</h3>
            <SplitSelector 
              session={session} 
              token={token!} 
              onSelectionChange={setSelection} 
            />
          </div>
        </section>
      </main>

      {selection && selection.montant > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t border-white/5 z-20">
          <div className="max-w-lg mx-auto">
            <button 
              onClick={handlePayment}
              disabled={processing}
              className={`
                w-full py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all active:scale-[0.98]
                ${processing ? 'bg-teal/50 cursor-wait' : 'bg-teal text-white hover:brightness-110'}
                flex items-center justify-center gap-3
              `}
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>Confirmer le paiement ({selection.montant.toFixed(2)} MAD)</>
              )}
            </button>
            <p className="text-[10px] text-center text-foreground-muted mt-4 uppercase tracking-widest opacity-50">Sécurisé par Tastify Pay</p>
          </div>
        </div>
      )}
    </div>
  )
}
