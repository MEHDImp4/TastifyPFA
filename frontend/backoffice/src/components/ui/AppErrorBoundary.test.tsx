import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppErrorBoundary } from '@shared/ui/AppErrorBoundary'

const ThrowOnRender = () => {
  throw new Error('KDS render crash')
}

describe('AppErrorBoundary', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    consoleErrorSpy.mockClear()
  })

  it('renders a visible fallback when a child crashes', () => {
    render(
      <AppErrorBoundary appLabel="Le back-office">
        <ThrowOnRender />
      </AppErrorBoundary>,
    )

    expect(
      screen.getByText(/Le back-office a rencontre une erreur de rendu/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recharger/i })).toBeInTheDocument()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})
