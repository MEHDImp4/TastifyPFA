import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WizardProvider, useWizard } from './WizardContext'

const wrapper = ({ children }: { children: ReactNode }) => (
  <WizardProvider>{children}</WizardProvider>
)

describe('WizardContext', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('setDateTime updates date/time fields in state', () => {
    const { result } = renderHook(() => useWizard(), { wrapper })

    act(() => {
      result.current.setDateTime({
        date: '2026-06-15',
        heure_debut: '19:00',
        heure_fin: '21:00',
        nombre_personnes: 4,
      })
    })

    expect(result.current.state.date).toBe('2026-06-15')
    expect(result.current.state.heure_debut).toBe('19:00')
    expect(result.current.state.heure_fin).toBe('21:00')
    expect(result.current.state.nombre_personnes).toBe(4)
  })

  it('setTable updates selectedTable in state', () => {
    const { result } = renderHook(() => useWizard(), { wrapper })

    act(() => {
      result.current.setTable({
        id: 5,
        numero: 5,
        capacite: 4,
        statut: 'LIBRE',
        pos_x: 100,
        pos_y: 100,
        est_active: true,
        created_at: '',
        updated_at: '',
      })
    })

    expect(result.current.state.selectedTable?.id).toBe(5)
  })

  it('reset clears state back to initial values', () => {
    const { result } = renderHook(() => useWizard(), { wrapper })

    act(() => {
      result.current.setDateTime({
        date: '2026-06-15',
        heure_debut: '19:00',
        heure_fin: '21:00',
        nombre_personnes: 4,
      })
      result.current.reset()
    })

    expect(result.current.state.date).toBe('')
    expect(result.current.state.nombre_personnes).toBe(1)
    expect(result.current.state.selectedTable).toBeNull()
  })

  it('useWizard throws when called outside WizardProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useWizard())).toThrow('useWizard must be used inside WizardProvider')
  })
})
