import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryDrawer } from './CategoryDrawer';
import axiosInstance from '@shared/auth/axiosInstance';

// Mock axiosInstance
vi.mock('@shared/auth/axiosInstance', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('CategoryDrawer Component', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with inputs', () => {
    render(
      <CategoryDrawer isOpen={true} onClose={onClose} onSuccess={onSuccess} />
    );
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ordre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/image/i)).toBeInTheDocument();
  });

  it('shows validation error if nom is empty on submit', async () => {
    render(
      <CategoryDrawer isOpen={true} onClose={onClose} onSuccess={onSuccess} />
    );
    const submitBtn = screen.getByRole('button', { name: /enregistrer/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/le nom est requis/i)).toBeInTheDocument();
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });

  it('submits form data for new category', async () => {
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({});
    render(
      <CategoryDrawer isOpen={true} onClose={onClose} onSuccess={onSuccess} />
    );
    
    fireEvent.change(screen.getByLabelText(/nom/i), { target: { value: 'New Category' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Desc' } });
    fireEvent.change(screen.getByLabelText(/ordre/i), { target: { value: '10' } });

    const submitBtn = screen.getByRole('button', { name: /enregistrer/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalled();
      const call = vi.mocked(axiosInstance.post).mock.calls[0];
      const formData = call[1] as FormData;
      expect(formData.get('nom')).toBe('New Category');
      expect(formData.get('description')).toBe('Desc');
      expect(formData.get('ordre_affichage')).toBe('10');
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('pre-fills data when editing', () => {
    const initialData = {
      id: 1,
      nom: 'Existing',
      description: 'Old desc',
      ordre_affichage: 5,
      image: 'http://example.com/old.jpg',
      est_active: true,
    };
    render(
      <CategoryDrawer isOpen={true} onClose={onClose} onSuccess={onSuccess} initialData={initialData} />
    );
    expect(screen.getByLabelText(/nom/i)).toHaveValue('Existing');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Old desc');
    expect(screen.getByLabelText(/ordre/i)).toHaveValue(5);
    // Check preview
    const preview = screen.getByAltText('Preview');
    expect(preview).toHaveAttribute('src', 'http://example.com/old.jpg');
  });
});
