import { render, screen, fireEvent } from '@testing-library/react';
import { PlatListTable } from './PlatListTable';
import { Plat } from './types';
import { describe, it, expect, vi } from 'vitest';

const mockPlats: Plat[] = [
  {
    id: 1,
    nom: 'Burger Classic',
    description: 'Un délicieux burger',
    prix: 15.5,
    image: 'burger.jpg',
    categorie: 1,
    categorie_detail: { id: 1, nom: 'Burgers', est_active: true },
    est_disponible: true,
    est_active: true
  },
  {
    id: 2,
    nom: 'Salade César',
    description: 'Fraîche et croquante',
    prix: 12.0,
    image: 'salade.jpg',
    categorie: 2,
    categorie_detail: { id: 2, nom: 'Salades', est_active: true },
    est_disponible: false,
    est_active: false
  }
];

describe('PlatListTable', () => {
  it('renders all plats with their details', () => {
    render(
      <PlatListTable 
        plats={mockPlats} 
        onEdit={() => {}} 
        onDelete={() => {}} 
        onToggleStatus={() => {}} 
      />
    );

    expect(screen.getByText('Burger Classic')).toBeInTheDocument();
    expect(screen.getByText('Salade César')).toBeInTheDocument();
    expect(screen.getByText('15.50 €')).toBeInTheDocument();
    expect(screen.getByText('12.00 €')).toBeInTheDocument();
    expect(screen.getByText('Burgers')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(
      <PlatListTable 
        plats={mockPlats} 
        onEdit={onEdit} 
        onDelete={() => {}} 
        onToggleStatus={() => {}} 
      />
    );

    const editButtons = screen.getAllByTitle('Modifier');
    fireEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(mockPlats[0]);
  });

  it('shows confirmation when delete is clicked and calls onDelete', () => {
    const onDelete = vi.fn();
    render(
      <PlatListTable 
        plats={mockPlats} 
        onEdit={() => {}} 
        onDelete={onDelete} 
        onToggleStatus={() => {}} 
      />
    );

    const deleteButtons = screen.getAllByTitle('Supprimer');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Confirmer?')).toBeInTheDocument();
    
    const confirmButton = screen.getByTitle('Confirmer la suppression');
    fireEvent.click(confirmButton);
    expect(onDelete).toHaveBeenCalledWith(mockPlats[0]);
  });

  it('calls onToggleStatus when switches are toggled', () => {
    const onToggleStatus = vi.fn();
    render(
      <PlatListTable 
        plats={mockPlats} 
        onEdit={() => {}} 
        onDelete={() => {}} 
        onToggleStatus={onToggleStatus} 
      />
    );

    const switches = screen.getAllByRole('button', { name: /Changer la disponibilité/i });
    fireEvent.click(switches[0]);
    expect(onToggleStatus).toHaveBeenCalledWith(mockPlats[0], 'est_disponible');
  });

  it('dims inactive rows', () => {
    const { container } = render(
      <PlatListTable 
        plats={mockPlats} 
        onEdit={() => {}} 
        onDelete={() => {}} 
        onToggleStatus={() => {}} 
      />
    );

    const rows = container.querySelectorAll('tr.group');
    // Second plat is inactive (est_active: false)
    expect(rows[1]).toHaveClass('opacity-60');
  });
});
