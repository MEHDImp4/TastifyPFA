import type { ReactNode } from 'react'
import { createContext, useContext, useState } from 'react'
import type { Table } from '@shared/types/tables'

export interface WizardState {
  date: string
  heure_debut: string
  heure_fin: string
  nombre_personnes: number
  selectedTable: Table | null
}

interface WizardContextValue {
  state: WizardState
  setDateTime: (
    fields: Pick<WizardState, 'date' | 'heure_debut' | 'heure_fin' | 'nombre_personnes'>
  ) => void
  setTable: (table: Table) => void
  reset: () => void
}

const INITIAL_STATE: WizardState = {
  date: '',
  heure_debut: '',
  heure_fin: '',
  nombre_personnes: 1,
  selectedTable: null,
}

const WizardContext = createContext<WizardContextValue | null>(null)

export const useWizard = (): WizardContextValue => {
  const context = useContext(WizardContext)

  if (!context) {
    throw new Error('useWizard must be used inside WizardProvider')
  }

  return context
}

export const WizardProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<WizardState>(INITIAL_STATE)

  const setDateTime = (
    fields: Pick<WizardState, 'date' | 'heure_debut' | 'heure_fin' | 'nombre_personnes'>
  ) => {
    setState((current) => ({ ...current, ...fields }))
  }

  const setTable = (table: Table) => {
    setState((current) => ({ ...current, selectedTable: table }))
  }

  const reset = () => {
    setState(INITIAL_STATE)
  }

  return (
    <WizardContext.Provider value={{ state, setDateTime, setTable, reset }}>
      {children}
    </WizardContext.Provider>
  )
}
