import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TableMap } from '@shared/components/map/TableMap'
import type { Table } from '@shared/types/tables'
import { fetchAvailableTables } from '../../api/reservations'
import { useWizard } from './WizardContext'

export const StepTableSelect = () => {
  const navigate = useNavigate()
  const { state, setTable } = useWizard()
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!state.date) {
      navigate('/reservations/new', { replace: true })
      return
    }

    let isActive = true

    const loadTables = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const availableTables = await fetchAvailableTables({
          date: state.date,
          heure_debut: state.heure_debut,
          heure_fin: state.heure_fin,
          nombre_personnes: state.nombre_personnes,
        })

        if (isActive) {
          setTables(availableTables)
        }
      } catch (loadError) {
        if (isActive) {
          setError('Impossible de charger les tables disponibles pour le moment.')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadTables()

    return () => {
      isActive = false
    }
  }, [navigate, state.date, state.heure_debut, state.heure_fin, state.nombre_personnes])

  const handleTableClick = (table: Table) => {
    if (table.est_disponible === false || table.statut !== 'LIBRE') {
      return
    }

    setTable(table)
    navigate('/reservations/confirm')
  }

  return (
    <div className="px-6 py-8">
      <section className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-surface p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber">Etape 2</p>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">
              Choisissez votre table
            </h1>
            <p className="text-sm leading-6 text-foreground-muted">
              {state.date} · {state.heure_debut} a {state.heure_fin} · {state.nombre_personnes}{' '}
              personne{state.nombre_personnes > 1 ? 's' : ''}
            </p>
          </div>

          <button
            className="min-h-11 rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-foreground-muted active:scale-[0.97]"
            onClick={() => navigate('/reservations/new')}
            style={{ transition: 'transform 160ms ease-out, opacity 180ms ease-out' }}
            type="button"
          >
            Modifier les horaires
          </button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-white/5 bg-surface-elevated/60 text-sm text-foreground-muted">
            Chargement des tables disponibles...
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-error/30 bg-error/10 px-4 py-4 text-sm text-error" role="alert">
            {error}
          </p>
        ) : tables.length === 0 ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-white/5 bg-surface-elevated/60 text-sm text-foreground-muted">
            Aucune table disponible sur ce crenau.
          </div>
        ) : (
          <div className="space-y-4">
            <TableMap isEditMode={false} onTableClick={handleTableClick} tables={tables} />
            <p className="text-sm text-foreground-muted">
              Touchez une table libre pour continuer. Les tables deja reservees restent visibles mais ne sont pas selectionnables.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
