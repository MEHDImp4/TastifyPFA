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
});
