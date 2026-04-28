import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlatsPage from './index';
import axiosInstance from '@shared/auth/axiosInstance';
import { useResponsiveListView } from './useResponsiveListView';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@shared/auth/axiosInstance');
vi.mock('./useResponsiveListView');

const mockCategories = [
  { id: 1, nom: 'Entrées', est_active: true },
  { id: 2, nom: 'Plats', est_active: true },
];

const mockPlats = [
  { id: 1, nom: 'Salade', prix: 10, categorie: 1, est_active: true, est_disponible: true },
];

describe('PlatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useResponsiveListView as any).mockReturnValue('desktop');
    (axiosInstance.get as any).mockImplementation((url: string) => {
      if (url.includes('/categories/')) {
        return Promise.resolve({ data: mockCategories });
      }
      if (url.includes('/plats/')) {
        return Promise.resolve({ data: mockPlats });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders page title and loading state initially', async () => {
    render(<PlatsPage />);
    expect(screen.getByText('Gestion des Plats')).toBeInTheDocument();
  });

  it('loads and displays categories and plats count', async () => {
    render(<PlatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Entrées')).toBeInTheDocument();
      expect(screen.getByText('Plats')).toBeInTheDocument();
    });

    expect(screen.getByText(/1 plats trouvés/)).toBeInTheDocument();
  });

  it('filters plats when category is selected', async () => {
    render(<PlatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Entrées')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Entrées'));

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/plats/?categorie=1');
    });
  });

  it('displays error message on fetch failure', async () => {
    (axiosInstance.get as any).mockRejectedValue(new Error('API Error'));

    render(<PlatsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Une erreur est survenue/)).toBeInTheDocument();
    });
  });
});
