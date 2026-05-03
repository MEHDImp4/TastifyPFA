import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TicketCard } from './TicketCard';

vi.mock('./KdsTimer', () => ({
  KdsTimer: () => <div data-testid="mock-timer">10:00</div>,
}));

describe('TicketCard', () => {
  const mockOrder: any = {
    id: 123,
    table: 5,
    created_at: new Date().toISOString(),
    serveur_username: 'mehdi',
    lignes: [
      {
        id: 1,
        quantite: 2,
        plat_details: { nom: 'Couscous' },
        notes: 'Sans oignons',
      },
      {
        id: 2,
        quantite: 1,
        plat_details: { nom: 'Tajine' },
        notes: '',
      },
    ],
  };

  it('renders order details correctly', () => {
    render(<TicketCard order={mockOrder} />);
    
    expect(screen.getByText('5')).toBeDefined(); // Table number
    expect(screen.getByText('#123')).toBeDefined(); // Order ID
    expect(screen.getByText('mehdi')).toBeDefined(); // Waiter name
    expect(screen.getByText(/2 PLATS/)).toBeDefined();
    expect(screen.getByText(/3 PORTIONS/)).toBeDefined();
  });

  it('renders items and quantities', () => {
    render(<TicketCard order={mockOrder} />);
    
    expect(screen.getByText(/Couscous/i)).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText(/Tajine/i)).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
  });

  it('renders prep notes when present', () => {
    render(<TicketCard order={mockOrder} />);
    
    expect(screen.getByText('Sans oignons')).toBeDefined();
  });

  it('renders the timer component', () => {
    render(<TicketCard order={mockOrder} />);
    
    expect(screen.getByTestId('mock-timer')).toBeDefined();
  });

  describe('Phase 16 — New ticket glow', () => {
    it('applies animate-new-ticket class when isNew=true (P16-FE-03)', () => {
      // @ts-ignore - isNew doesn't exist yet
      render(<TicketCard order={mockOrder} isNew={true} />);
      const article = screen.getByTestId(`ticket-card-${mockOrder.id}`);
      expect(article.className).toContain('animate-new-ticket');
    });

    it('does NOT apply animate-new-ticket when isNew=false (P16-FE-03)', () => {
      // @ts-ignore - isNew doesn't exist yet
      render(<TicketCard order={mockOrder} isNew={false} />);
      const article = screen.getByTestId(`ticket-card-${mockOrder.id}`);
      expect(article.className).not.toContain('animate-new-ticket');
    });

    it('removes animate-new-ticket class after 10 seconds (P16-FE-04)', () => {
      vi.useFakeTimers();
      try {
        // @ts-ignore - isNew doesn't exist yet
        const { rerender } = render(<TicketCard order={mockOrder} isNew={true} />);
        const article = screen.getByTestId(`ticket-card-${mockOrder.id}`);
        expect(article.className).toContain('animate-new-ticket');

        vi.advanceTimersByTime(10_000);
        // @ts-ignore - isNew doesn't exist yet
        rerender(<TicketCard order={mockOrder} isNew={true} />);

        const articleAfter = screen.getByTestId(`ticket-card-${mockOrder.id}`);
        expect(articleAfter.className).not.toContain('animate-new-ticket');
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
