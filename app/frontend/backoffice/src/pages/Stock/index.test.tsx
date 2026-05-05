import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StockPage from './index';
import axiosInstance from '@shared/auth/axiosInstance';

vi.mock('@shared/auth/axiosInstance');
vi.mock('@shared/auth/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { role: 'GERANT' },
  }),
}));

const stockItems = Array.from({ length: 13 }, (_, index) => ({
  id: index + 1,
  nom: `Ingredient ${index + 1}`,
  unite_mesure: 'g' as const,
  stock_actuel: index + 1,
  seuil_alerte: 1,
  est_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}));

describe('StockPage pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (axiosInstance.get as any).mockResolvedValue({ data: stockItems });
  });

  it('paginates ingredients and resets when search changes', async () => {
    render(<StockPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Ingredient 1').length).toBeGreaterThan(0);
    });

    expect(screen.queryByText('Ingredient 13')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /Page suivante/i })[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Ingredient 13').length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByPlaceholderText(/Rechercher un ingrédient/i), {
      target: { value: 'Ingredient 2' },
    });

    await waitFor(() => {
      expect(screen.getAllByText('Ingredient 2').length).toBeGreaterThan(0);
    });

    expect(screen.queryByText('Ingredient 1')).not.toBeInTheDocument();
  });
});
