import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SallePage } from './SallePage';
import { salleApi } from '../../api/salle';
import type { Table } from '../../types/salle';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../api/salle', () => ({
  salleApi: {
    getTables: vi.fn(),
  },
}));

vi.mock('../../store/socketStore', () => ({
  useSocketStore: vi.fn().mockImplementation((selector: any) => selector({ lastUpdate: null })),
}));

describe('SallePage component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(salleApi.getTables).mockReturnValue(new Promise(() => {}));
    render(<SallePage />);
    // Grid tables should not be rendered yet
    expect(screen.queryByTestId('table-2')).toBeNull();
  });

  it('renders active tables correctly and handles click redirection', async () => {
    const mockTables: Table[] = [
      {
        id: 101,
        numero: 5,
        capacite: 4,
        statut: 'LIBRE',
        est_active: true,
        pos_x: 100,
        pos_y: 200,
      },
      {
        id: 102,
        numero: 2,
        capacite: 2,
        statut: 'OCCUPEE',
        est_active: true,
        pos_x: 150,
        pos_y: 250,
      },
      {
        id: 103,
        numero: 9,
        capacite: 6,
        statut: 'LIBRE',
        est_active: false, // Should be filtered out
        pos_x: 200,
        pos_y: 300,
      },
    ];

    vi.mocked(salleApi.getTables).mockResolvedValue({
      data: mockTables,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    render(<SallePage />);

    // Wait for the tables to render
    await waitFor(() => {
      expect(screen.getByText('Plan de Salle')).toBeDefined();
    });

    // Check sorted table numbers
    const buttons = screen.getAllByRole('button');
    // Button 1 is Table 2, Button 2 is Table 5 (sorted by numero: 2, 5)
    // Find Table numbers in buttons
    expect(screen.getByTestId('table-2')).toBeDefined();
    expect(screen.getByTestId('table-5')).toBeDefined();
    expect(screen.queryByTestId('table-9')).toBeNull(); // inactive table should be filtered out

    // Click Table 2 and verify navigation
    const table2Button = screen.getByTestId('table-2');
    fireEvent.click(table2Button);

    expect(mockNavigate).toHaveBeenCalledWith('/ordering/102');
  });
});
