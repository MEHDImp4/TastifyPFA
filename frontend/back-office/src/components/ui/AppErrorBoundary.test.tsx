import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { AppErrorBoundary } from './AppErrorBoundary';

const ThrowOnRender = () => {
  throw new Error('KDS render crash');
};

describe('AppErrorBoundary', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  it('renders a visible fallback when a child crashes', () => {
    render(
      <AppErrorBoundary>
        <ThrowOnRender />
      </AppErrorBoundary>,
    );

    expect(
      screen.getByText(/Le back-office a rencontre une erreur de rendu|Le back-office a rencontré une erreur de rendu/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recharger/i })).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
