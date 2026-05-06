import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axiosInstance from '@shared/auth/axiosInstance'
import { PaymentSession } from '@shared/types/paiements'

export const PaymentLandingPage = () => {
  const { token } = useParams<{ token: string }>()
  const [session, setSession] = useState<PaymentSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const resolveSession = async () => {
      try {
        const response = await axiosInstance.post('/paiements/session/resolve/', { token })
        setSession(response.data)
      } catch (err: any) {
        setError(err.response?.data?.error || "Lien de paiement invalide ou expiré.")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      resolveSession()
    }
  }, [token])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="animate-pulse text-teal font-semibold tracking-widest uppercase text-sm">Chargement...</div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <h1 className="mb-2 text-xl font-bold text-terracotta">Oups !</h1>
        <p className="text-foreground-muted">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-surface">
        <span className="text-sm font-semibold tracking-wide text-teal uppercase">Tastify Check-out</span>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full">
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-1">Votre Table</h2>
          <p className="text-foreground-muted mb-6">Session active pour la Table {session.table_id}</p>

          <div className="bg-surface border border-white/10 rounded-xl p-6 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-foreground-muted">Total de la commande</span>
              <span className="font-semibold text-lg">{session.montant_total} MAD</span>
            </div>
            {session.montant_paye > 0 && (
              <div className="flex justify-between items-center mb-2 text-teal">
                <span>Déjà payé</span>
                <span>-{session.montant_paye} MAD</span>
              </div>
            )}
            <div className="border-t border-white/5 my-4 pt-4 flex justify-between items-center">
              <span className="font-bold text-xl text-amber">Reste à payer</span>
              <span className="font-bold text-2xl text-amber">{session.montant_restant} MAD</span>
            </div>
          </div>
        </section>

        {/* Placeholder for Split Selector (Task 2) */}
        <div className="mt-8 border-2 border-dashed border-white/10 rounded-xl p-8 text-center text-foreground-muted italic">
          Options de partage à venir...
        </div>
      </main>
    </div>
  )
}
