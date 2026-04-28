import { render, screen, fireEvent } from '@testing-library/react';
import { PlatMobileCard } from './PlatMobileCard';
import { Plat } from './types';
import { describe, it, expect, vi } from 'vitest';

const mockPlat: Plat = {
  id: 1,
  nom: 'Burger Classic',
  description: 'Un délicieux burger',
  prix: 15.5,
  temps_preparation: 15,
  image: 'burger.jpg',
  categorie: 1,
  categorie_detail: { id: 1, nom: 'Burgers', est_active: true },
  est_disponible: true,
  est_active: true
};

describe('PlatMobileCard', () => {
  it('renders plat details', () => {
    render(
      <PlatMobileCard 
        plat={mockPlat} 
        onEdit={() => {}} 
        onDelete={() => {}} 
        onToggleStatus={() => {}} 
      />
    );

    expect(screen.getByText('Burger Classic')).toBeInTheDocument();
    expect(screen.getByText('15.50 €')).toBeInTheDocument();
    expect(screen.getByText('Burgers')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(
      <PlatMobileCard 
        plat={mockPlat} 
        onEdit={onEdit} 
        onDelete={() => {}} 
        onToggleStatus={() => {}} 
      />
    );

    const editButton = screen.getByTitle('Modifier');
    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith(mockPlat);
  });

  it('calls onToggleStatus when switches are toggled', () => {
    const onToggleStatus = vi.fn();
    render(
      <PlatMobileCard 
        plat={mockPlat} 
        onEdit={() => {}} 
        onDelete={() => {}} 
        onToggleStatus={onToggleStatus} 
      />
    );

    const switches = screen.getAllByRole('button', { name: /Changer la disponibilité/i });
    fireEvent.click(switches[0]);
    expect(onToggleStatus).toHaveBeenCalledWith(mockPlat, 'est_disponible');
  });
});
