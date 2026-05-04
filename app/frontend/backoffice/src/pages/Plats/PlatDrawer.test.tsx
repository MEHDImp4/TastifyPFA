import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlatDrawer } from './PlatDrawer';
import axiosInstance from '@shared/auth/axiosInstance';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@shared/auth/axiosInstance');

const mockCategories = [
  { id: 1, nom: 'Entrées', est_active: true },
  { id: 2, nom: 'Plats', est_active: true },
];

describe('PlatDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly for new plat', () => {
    render(
      <PlatDrawer 
        isOpen={true} 
        onClose={() => {}} 
        onSuccess={() => {}} 
        categories={mockCategories} 
      />
    );

    expect(screen.getByText('Nouveau Plat')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom/i)).toHaveValue('');
  });

  it('validates required fields', async () => {
    render(
      <PlatDrawer 
        isOpen={true} 
        onClose={() => {}} 
        onSuccess={() => {}} 
        categories={mockCategories} 
      />
    );

    fireEvent.click(screen.getByText('Créer le plat'));

    await waitFor(() => {
      expect(screen.getByText('Le nom est requis.')).toBeInTheDocument();
      expect(screen.getByText('La catégorie est requise.')).toBeInTheDocument();
    });
  });

  it('calls API on submit for new plat', async () => {
    (axiosInstance.post as any).mockResolvedValue({ data: {} });
    
    render(
      <PlatDrawer 
        isOpen={true} 
        onClose={() => {}} 
        onSuccess={() => {}} 
        categories={mockCategories} 
      />
    );

    fireEvent.change(screen.getByLabelText(/Nom/i), { target: { value: 'Test Plat' } });
    fireEvent.change(screen.getByLabelText(/Catégorie/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Prix/i), { target: { value: '10' } });

    fireEvent.click(screen.getByText('Créer le plat'));

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith('/plats/', expect.any(FormData), expect.any(Object));
    });
  });
});
