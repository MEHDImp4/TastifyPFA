import { render, screen } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect } from 'vitest';
import { KdsPage } from './KdsPage';
import { useKdsStore } from './store/useKdsStore';

vi.mock('./store/useKdsStore', () => ({
  useKdsStore: vi.fn(),
}));

vi.mock('./KdsSocketManager', () => ({
  KdsSocketManager: () => <div data-testid="socket-manager" />,
}));

vi.mock('./components/TicketCard', () => ({
  TicketCard: ({ order }: any) => <div data-testid={`ticket-${order.id}`}>Ticket {order.id}</div>,
}));

describe('KdsPage', () => {
  const mockFetchOrders = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when orders are being fetched', () => {
    (useKdsStore as any).mockReturnValue({
      orders: [],
      isLoading: true,
      error: null,
      fetchOrders: mockFetchOrders,
    });

    render(<KdsPage />);
    expect(screen.getByTestId('loader')).toBeDefined();
  });

  it('renders empty state when no orders', () => {
    (useKdsStore as any).mockReturnValue({
      orders: [],
      isLoading: false,
      error: null,
      fetchOrders: mockFetchOrders,
    });

    render(<KdsPage />);
    expect(screen.getByText('Cuisine Vide')).toBeDefined();
    expect(mockFetchOrders).toHaveBeenCalled();
  });

  it('renders tickets for active orders', () => {
    const mockOrders = [
      { id: 1, table: 5, lignes: [] },
      { id: 2, table: 10, lignes: [] },
    ];

    (useKdsStore as any).mockReturnValue({
      orders: mockOrders,
      isLoading: false,
      error: null,
      fetchOrders: mockFetchOrders,
    });

    render(<KdsPage />);
    expect(screen.getByTestId('ticket-1')).toBeDefined();
    expect(screen.getByTestId('ticket-2')).toBeDefined();
  });

  it('renders error message when present', () => {
    (useKdsStore as any).mockReturnValue({
      orders: [],
      isLoading: false,
      error: 'Failed to fetch',
      fetchOrders: mockFetchOrders,
    });

    render(<KdsPage />);
    expect(screen.getByText('Failed to fetch')).toBeDefined();
  });
});
