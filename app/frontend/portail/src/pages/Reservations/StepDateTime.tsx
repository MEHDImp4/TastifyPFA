import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWizard } from './WizardContext'

export const StepDateTime = () => {
  const navigate = useNavigate()
  const { state, setDateTime } = useWizard()
  const [timeError, setTimeError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const date = String(formData.get('date') ?? '')
    const heure_debut = String(formData.get('heure_debut') ?? '')
    const heure_fin = String(formData.get('heure_fin') ?? '')
    const nombre_personnes = parseInt(String(formData.get('nombre_personnes') ?? '1'), 10)

    if (heure_fin <= heure_debut) {
      setTimeError("L'heure de fin doit etre apres l'heure de debut.")
      return
    }

    setTimeError(null)
    setDateTime({ date, heure_debut, heure_fin, nombre_personnes })
    navigate('/reservations/table')
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-10">
      <section className="w-full max-w-md rounded-[28px] border border-white/10 bg-surface p-8 shadow-2xl">
        <div className="mb-8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal">Reservation</p>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">Etape 1 - Date et heure</h1>
          <p className="text-sm leading-6 text-foreground-muted">
            Choisissez un horaire clair pour que nous puissions vous proposer les tables disponibles.
          </p>
        </div>

        <form
          aria-label="Formulaire de reservation"
          className="space-y-5"
          onSubmit={handleSubmit}
        >
          <label className="block space-y-2 text-sm text-foreground-muted">
            <span>Date</span>
            <input
              className="min-h-11 w-full rounded-lg border border-white/10 bg-surface-elevated px-4 py-3 text-white outline-none"
              defaultValue={state.date}
              min={new Date().toISOString().split('T')[0]}
              name="date"
              required
              style={{
                colorScheme: 'dark',
                transition: 'border-color 180ms ease-out, opacity 180ms ease-out',
              }}
              type="date"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block space-y-2 text-sm text-foreground-muted">
              <span>Heure d'arrivee</span>
              <input
                className="min-h-11 w-full rounded-lg border border-white/10 bg-surface-elevated px-4 py-3 text-white outline-none"
                defaultValue={state.heure_debut}
                name="heure_debut"
                required
                style={{
                  colorScheme: 'dark',
                  transition: 'border-color 180ms ease-out, opacity 180ms ease-out',
                }}
                type="time"
              />
            </label>

            <label className="block space-y-2 text-sm text-foreground-muted">
              <span>Heure de depart</span>
              <input
                className="min-h-11 w-full rounded-lg border border-white/10 bg-surface-elevated px-4 py-3 text-white outline-none"
                defaultValue={state.heure_fin}
                name="heure_fin"
                required
                style={{
                  colorScheme: 'dark',
                  transition: 'border-color 180ms ease-out, opacity 180ms ease-out',
                }}
                type="time"
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm text-foreground-muted">
            <span>Nombre de personnes</span>
            <input
              className="min-h-11 w-full rounded-lg border border-white/10 bg-surface-elevated px-4 py-3 text-white outline-none"
              defaultValue={state.nombre_personnes}
              max={20}
              min={1}
              name="nombre_personnes"
              required
              style={{ transition: 'border-color 180ms ease-out, opacity 180ms ease-out' }}
              type="number"
            />
          </label>

          {timeError ? (
            <p className="text-sm text-error" role="alert">
              {timeError}
            </p>
          ) : null}

          <button
            className="min-h-11 w-full rounded-lg bg-teal px-4 py-3 text-sm font-semibold text-white active:scale-[0.97]"
            style={{ transition: 'transform 160ms ease-out, opacity 180ms ease-out' }}
            type="submit"
          >
            Choisir une table
          </button>
        </form>
      </section>
    </div>
  )
}
