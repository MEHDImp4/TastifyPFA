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
  { 
    id: 1, 
    nom: 'Salade', 
    prix: 10, 
    temps_preparation: 5,
    categorie: 1, 
    categorie_detail: { id: 1, nom: 'Entrées', est_active: true },
    est_active: true, 
    est_disponible: true 
  },
];

describe('PlatsPage Integration', () => {
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

  it('opens drawer on "Nouveau Plat" click', async () => {
    render(<PlatsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Nouveau Plat')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nouveau Plat'));

    expect(screen.getByRole('heading', { name: /Nouveau Plat/i })).toBeInTheDocument();
  });

  it('preselects category when creating from filtered list', async () => {
    render(<PlatsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Entrées')[0]).toBeInTheDocument();
    });

    // Filter by Entrées
    fireEvent.click(screen.getAllByText('Entrées')[0]);

    // Wait for plats to load
    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/plats/?categorie=1');
    });

    // Click New Plat
    fireEvent.click(screen.getByText('Nouveau Plat'));

    // Category select should have value "1"
    const select = screen.getByLabelText(/Catégorie/i) as HTMLSelectElement;
    expect(select.value).toBe('1');
  });

  it('shows empty state with create button when no plats found', async () => {
    (axiosInstance.get as any).mockImplementation((url: string) => {
      if (url.includes('/categories/')) return Promise.resolve({ data: mockCategories });
      if (url.includes('/plats/')) return Promise.resolve({ data: [] });
      return Promise.reject(new Error('Not found'));
    });

    render(<PlatsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Aucun plat n'a été créé/i)).toBeInTheDocument();
    });

    // Filter by Entrées
    fireEvent.click(screen.getAllByText('Entrées')[0]);

    await waitFor(() => {
      expect(screen.getByText(/Aucun plat trouvé dans la catégorie "Entrées"/i)).toBeInTheDocument();
    });
  });
});
