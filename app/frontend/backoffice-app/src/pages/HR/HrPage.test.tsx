import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HrPage } from './HrPage';
import { hrApi } from '../../api/inventory_hr';
import type { Employe } from '../../types/inventory';

vi.mock('../../api/inventory_hr', () => ({
  hrApi: {
    getEmployes: vi.fn(),
    getEmployesPage: vi.fn(),
  },
}));

describe('HrPage component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(hrApi.getEmployesPage).mockReturnValue(new Promise(() => {}));
    render(<HrPage />);
    expect(screen.queryByText("Toute l'équipe")).toBeNull();
  });

  it('renders employees list with user_details correctly', async () => {
    const mockEmployes: Employe[] = [
      {
        id: 1,
        user: 10,
        salaire: '2500.00',
        poste: 'GERANT',
        telephone: '0612345678',
        cin: 'AB12345',
        date_embauche: '2026-01-01',
        user_details: {
          id: 10,
          username: 'chef_gerant',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@tastify.com',
          role: 'GERANT',
          is_active: true,
        },
      },
    ];

    vi.mocked(hrApi.getEmployesPage).mockResolvedValue({
      data: {
        count: mockEmployes.length,
        next: null,
        previous: null,
        results: mockEmployes,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    render(<HrPage />);

    await waitFor(() => {
      expect(screen.getByText("Toute l'équipe")).toBeDefined();
    });

    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('@chef_gerant')).toBeDefined();
    expect(screen.getByText('john.doe@tastify.com')).toBeDefined();
    expect(screen.getByText('ACTIF')).toBeDefined();
  });

  it('falls back to root-level employee properties when user_details is missing', async () => {
    const mockEmployes: Employe[] = [
      {
        id: 2,
        user: 20,
        salaire: '2000.00',
        poste: 'SERVEUR',
        telephone: '0687654321',
        cin: 'CD98765',
        date_embauche: '2026-02-02',
        username: 'alice_root',
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice@tastify.com',
        is_active: false,
      },
    ];

    vi.mocked(hrApi.getEmployesPage).mockResolvedValue({
      data: {
        count: mockEmployes.length,
        next: null,
        previous: null,
        results: mockEmployes,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    render(<HrPage />);

    await waitFor(() => {
      expect(screen.getByText("Toute l'équipe")).toBeDefined();
    });

    expect(screen.getByText('Alice Smith')).toBeDefined();
    expect(screen.getByText('@alice_root')).toBeDefined();
    expect(screen.getByText('alice@tastify.com')).toBeDefined();
    expect(screen.getByText('INACTIF')).toBeDefined();
  });
});
