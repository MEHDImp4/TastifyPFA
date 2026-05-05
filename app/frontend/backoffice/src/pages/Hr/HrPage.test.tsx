import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HrPage from './HrPage';
import hrService from './hrService';

vi.mock('./hrService', () => ({
  default: {
    getEmployees: vi.fn(),
    createEmployee: vi.fn(),
    updateEmployee: vi.fn(),
    deleteEmployee: vi.fn(),
  },
}));

const employees = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  user: index + 1,
  user_details: {
    id: index + 1,
    username: `employee${index + 1}`,
    first_name: 'Employee',
    last_name: `${index + 1}`,
    email: `employee${index + 1}@tastify.test`,
    role: 'SERVEUR' as const,
    is_active: true,
  },
  poste: 'Serveur',
  salaire: '3500',
  date_embauche: '2026-01-01',
  telephone: '0600000000',
  adresse: 'Adresse',
  cin: `CIN${index + 1}`,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}));

describe('HrPage pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hrService.getEmployees).mockResolvedValue(employees);
  });

  it('paginates employees and resets when search changes', async () => {
    render(<HrPage />);

    await waitFor(() => {
      expect(screen.getByText('Employee 1')).toBeInTheDocument();
    });

    expect(screen.queryByText('Employee 9')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Page suivante/i }));

    await waitFor(() => {
      expect(screen.getByText('Employee 9')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Rechercher par nom, poste, CIN/i), {
      target: { value: 'Employee 1' },
    });

    await waitFor(() => {
      expect(screen.getByText('Employee 1')).toBeInTheDocument();
    });

    expect(screen.queryByText('Employee 9')).not.toBeInTheDocument();
  });
});
