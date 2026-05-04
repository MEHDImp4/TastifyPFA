import { fireEvent, render, screen } from '@testing-library/react';
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
    const mockState = {
      orders: [],
      isLoading: true,
      error: null,
      fetchOrders: mockFetchOrders,
      newOrderIds: new Set(),
      clearNewOrder: vi.fn(),
    };
    ;(useKdsStore as any).mockImplementation((sel: any) => (sel ? sel(mockState) : mockState))

    render(<KdsPage />);
    expect(screen.getByTestId('loader')).toBeDefined();
  });

  it('renders empty state when no orders', () => {
    const mockState = {
      orders: [],
      isLoading: false,
      error: null,
      fetchOrders: mockFetchOrders,
      newOrderIds: new Set(),
      clearNewOrder: vi.fn(),
    };
    ;(useKdsStore as any).mockImplementation((sel: any) => (sel ? sel(mockState) : mockState))

    render(<KdsPage />);
    expect(screen.getByText('Cuisine Vide')).toBeDefined();
    expect(mockFetchOrders).toHaveBeenCalled();
  });

  it('renders tickets for active orders', () => {
    const mockOrders = [
      { id: 1, table: 5, created_at: new Date().toISOString(), lignes: [] },
      { id: 2, table: 10, created_at: new Date().toISOString(), lignes: [] },
    ];

    const mockState = {
      orders: mockOrders,
      isLoading: false,
      error: null,
      fetchOrders: mockFetchOrders,
      newOrderIds: new Set(),
      clearNewOrder: vi.fn(),
    };
    ;(useKdsStore as any).mockImplementation((sel: any) => (sel ? sel(mockState) : mockState))

    render(<KdsPage />);
    expect(screen.getByTestId('ticket-1')).toBeDefined();
    expect(screen.getByTestId('ticket-2')).toBeDefined();
  });

  it('converts dominant vertical wheel movement into horizontal rail scrolling', () => {
    const mockOrders = [
      { id: 1, table: 5, created_at: new Date().toISOString(), lignes: [] },
    ];

    const mockState = {
      orders: mockOrders,
      isLoading: false,
      error: null,
      fetchOrders: mockFetchOrders,
      newOrderIds: new Set(),
      clearNewOrder: vi.fn(),
    };
    ;(useKdsStore as any).mockImplementation((sel: any) => (sel ? sel(mockState) : mockState))

    render(<KdsPage />);
    const rail = screen.getByTestId('kds-scroll-rail');
    Object.defineProperty(rail, 'scrollLeft', { value: 0, writable: true });

    fireEvent.wheel(rail, { deltaY: 80, deltaX: 0 });

    expect((rail as HTMLDivElement).scrollLeft).toBe(80);
  });

  it('renders error message when present', () => {
    const mockState = {
      orders: [],
      isLoading: false,
      error: 'Failed to fetch',
      fetchOrders: mockFetchOrders,
      newOrderIds: new Set(),
      clearNewOrder: vi.fn(),
    };
    ;(useKdsStore as any).mockImplementation((sel: any) => (sel ? sel(mockState) : mockState))

    render(<KdsPage />);
    expect(screen.getByText('Failed to fetch')).toBeDefined();
  });
});
