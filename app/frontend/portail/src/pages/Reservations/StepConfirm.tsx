import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createReservation } from '../../api/reservations'
import { useWizard } from './WizardContext'

export const StepConfirm = () => {
  const navigate = useNavigate()
  const { reset, state } = useWizard()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!state.date || !state.selectedTable) {
      navigate('/reservations/new', { replace: true })
    }
  }, [navigate, state.date, state.selectedTable])

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      await createReservation(state)
      reset()
      navigate('/reservations/new')
    } catch (submissionError) {
      console.error('Reservation creation failed', submissionError)
      setError('La reservation a echoue. Veuillez reessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!state.selectedTable) {
    return null
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-10">
      <section className="w-full max-w-md rounded-[28px] border border-white/10 bg-surface p-8 shadow-2xl">
        <div className="mb-8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal">Confirmation</p>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">
            Etape 3 - Verifiez votre reservation
          </h1>
          <p className="text-sm leading-6 text-foreground-muted">
            Un dernier controle avant l'envoi au restaurant.
          </p>
        </div>

        <dl className="space-y-4 rounded-3xl border border-white/5 bg-surface-elevated/60 p-5 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-foreground-muted">Date</dt>
            <dd className="font-medium text-white">{state.date}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-foreground-muted">Arrivee</dt>
            <dd className="font-medium text-white">{state.heure_debut}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-foreground-muted">Depart</dt>
            <dd className="font-medium text-white">{state.heure_fin}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-foreground-muted">Personnes</dt>
            <dd className="font-medium text-white">{state.nombre_personnes}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-foreground-muted">Table</dt>
            <dd className="font-medium text-white">Table {state.selectedTable.numero}</dd>
          </div>
        </dl>

        {error ? (
          <p className="mt-5 text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex gap-3">
          <button
            className="min-h-11 flex-1 rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-foreground-muted active:scale-[0.97]"
            onClick={() => navigate('/reservations/table')}
            style={{ transition: 'transform 160ms ease-out, opacity 180ms ease-out' }}
            type="button"
          >
            Modifier
          </button>
          <button
            className="min-h-11 flex-1 rounded-lg bg-teal px-4 py-3 text-sm font-semibold text-white active:scale-[0.97] disabled:opacity-50"
            disabled={isSubmitting}
            onClick={handleConfirm}
            style={{ transition: 'transform 160ms ease-out, opacity 180ms ease-out' }}
            type="button"
          >
            {isSubmitting ? 'Confirmation...' : 'Confirmer la reservation'}
          </button>
        </div>
      </section>
    </div>
  )
}
