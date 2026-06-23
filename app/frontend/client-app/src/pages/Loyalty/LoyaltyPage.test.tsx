import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoyaltyPage } from './LoyaltyPage';

vi.mock('../../api/loyalty', async () => {
  const actual = await vi.importActual<typeof import('../../api/loyalty')>('../../api/loyalty');

  return {
    ...actual,
    loyaltyApi: {
      getMyStatus: vi.fn(),
      getRewards: vi.fn(),
      redeemReward: vi.fn(),
    },
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const { loyaltyApi } = await import('../../api/loyalty');

describe('LoyaltyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unlocks rewards when the API returns decimal values as strings', async () => {
    vi.mocked(loyaltyApi.getMyStatus).mockResolvedValue({
      data: {
        points: '1200.00',
        tier: 'SILVER',
        tier_display: 'Silver Member',
      },
    } as Awaited<ReturnType<typeof loyaltyApi.getMyStatus>>);

    vi.mocked(loyaltyApi.getRewards).mockResolvedValue({
      data: [
        { id: 1, nom: 'Dessert offert', description: 'Sweet finish', points_requis: '300.00' },
        { id: 2, nom: 'Entrée offerte', description: 'Fresh start', points_requis: '500.00' },
        { id: 3, nom: 'Table VIP', description: 'Premium placement', points_requis: '2000.00' },
      ],
    } as Awaited<ReturnType<typeof loyaltyApi.getRewards>>);

    render(<LoyaltyPage />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /en profiter/i })).toHaveLength(2);
    });

    expect(screen.getByText(/verrouillé/i)).toBeInTheDocument();
  });
});
