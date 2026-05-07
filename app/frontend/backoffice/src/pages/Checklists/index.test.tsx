import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axiosInstance from '@shared/auth/axiosInstance';
import ChecklistsPage from './index';

vi.mock('@shared/auth/axiosInstance');

const useAuthStoreMock = vi.fn();

vi.mock('@shared/auth/useAuthStore', () => ({
  useAuthStore: () => useAuthStoreMock(),
}));

const executionPayload = [
  {
    id: 15,
    checklist: 4,
    checklist_details: {
      id: 4,
      titre: 'Ouverture salle',
      type: 'OUVERTURE',
      active: true,
      tasks: [
        {
          id: 9,
          description: 'Allumer la salle',
          ordre: 1,
          est_obligatoire: true,
          created_at: '2026-05-07T00:00:00Z',
          updated_at: '2026-05-07T00:00:00Z',
        },
      ],
      created_at: '2026-05-07T00:00:00Z',
      updated_at: '2026-05-07T00:00:00Z',
    },
    date: '2026-05-07',
    execute_par: 3,
    statut: 'EN_COURS',
    responses: [
      {
        id: 31,
        task: {
          id: 9,
          description: 'Allumer la salle',
          ordre: 1,
          est_obligatoire: true,
          created_at: '2026-05-07T00:00:00Z',
          updated_at: '2026-05-07T00:00:00Z',
        },
        est_complete: false,
        completed_at: null,
        completed_by: null,
        created_at: '2026-05-07T00:00:00Z',
        updated_at: '2026-05-07T00:00:00Z',
      },
    ],
    created_at: '2026-05-07T00:00:00Z',
    updated_at: '2026-05-07T00:00:00Z',
  },
];

const templatePayload = [
  {
    id: 4,
    titre: 'Ouverture salle',
    type: 'OUVERTURE',
    active: true,
    tasks: [
      {
        id: 9,
        description: 'Allumer la salle',
        ordre: 1,
        est_obligatoire: true,
        created_at: '2026-05-07T00:00:00Z',
        updated_at: '2026-05-07T00:00:00Z',
      },
    ],
    created_at: '2026-05-07T00:00:00Z',
    updated_at: '2026-05-07T00:00:00Z',
  },
];

describe('ChecklistsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStoreMock.mockReturnValue({
      user: { role: 'GERANT', username: 'manager' },
    });
    (axiosInstance.get as any).mockImplementation((url: string) => {
      if (url === '/checklists/executions/') {
        return Promise.resolve({ data: executionPayload });
      }

      if (url === '/checklists/') {
        return Promise.resolve({ data: templatePayload });
      }

      return Promise.resolve({ data: [] });
    });
    (axiosInstance.patch as any).mockResolvedValue({
      data: {
        ...executionPayload[0].responses[0],
        est_complete: true,
        completed_at: '2026-05-07T05:00:00Z',
        completed_by: 3,
      },
    });
    (axiosInstance.post as any).mockResolvedValue({ data: executionPayload[0] });
  });

  it('loads executions and exposes manager controls for gerant users', async () => {
    render(<ChecklistsPage />);

    expect(await screen.findByText('Ouverture salle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gérer les modèles/i })).toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument();
  });

  it('optimistically toggles a checklist item and calls the response patch endpoint', async () => {
    render(<ChecklistsPage />);

    const toggleButton = await screen.findByRole('button', { name: /Marquer complète/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(axiosInstance.patch).toHaveBeenCalledWith('/checklists/responses/31/', { est_complete: true });
    });

    expect(screen.getByText('Validée')).toBeInTheDocument();
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
  });

  it('hides manager controls for non-gerant staff', async () => {
    useAuthStoreMock.mockReturnValue({
      user: { role: 'SERVEUR', username: 'server' },
    });
    (axiosInstance.get as any).mockResolvedValue({ data: executionPayload });

    render(<ChecklistsPage />);

    expect(await screen.findByText('Ouverture salle')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Gérer les modèles/i })).not.toBeInTheDocument();
  });
});
