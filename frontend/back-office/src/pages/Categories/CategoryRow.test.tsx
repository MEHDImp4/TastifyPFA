import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryRow } from './CategoryRow';
import { axiosInstance } from '../../../../_shared/auth/axiosInstance';

// Mock axiosInstance
vi.mock('../../../../_shared/auth/axiosInstance', () => ({
  axiosInstance: {
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockCategory = {
  id: 1,
  nom: 'Burgers',
  description: 'Juicy burgers',
  ordre_affichage: 1,
  image: 'http://example.com/image.jpg',
  est_active: true,
};

describe('CategoryRow Component', () => {
  const onRefresh = vi.fn();
  const onEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders category details', () => {
    render(
      <table>
        <tbody>
          <CategoryRow category={mockCategory} onRefresh={onRefresh} onEdit={onEdit} />
        </tbody>
      </table>
    );
    expect(screen.getByText('Burgers')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('toggles active state and calls API', async () => {
    render(
      <table>
        <tbody>
          <CategoryRow category={mockCategory} onRefresh={onRefresh} onEdit={onEdit} />
        </tbody>
      </table>
    );
    const switchBtn = screen.getByRole('button', { name: '' }); // The Switch component
    fireEvent.click(switchBtn);

    expect(axiosInstance.patch).toHaveBeenCalledWith('/api/categories/1/', { est_active: false });
  });

  it('shows confirmation when delete is clicked', async () => {
    render(
      <table>
        <tbody>
          <CategoryRow category={mockCategory} onRefresh={onRefresh} onEdit={onEdit} />
        </tbody>
      </table>
    );
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/confirmer/i)).toBeInTheDocument();
    expect(screen.getByText(/annuler/i)).toBeInTheDocument();
  });

  it('calls delete API when confirmed', async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({});
    render(
      <table>
        <tbody>
          <CategoryRow category={mockCategory} onRefresh={onRefresh} onEdit={onEdit} />
        </tbody>
      </table>
    );
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    const confirmBtn = screen.getByText(/confirmer/i);
    fireEvent.click(confirmBtn);

    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/categories/1/');
    await waitFor(() => expect(onRefresh).toHaveBeenCalled());
  });
});
