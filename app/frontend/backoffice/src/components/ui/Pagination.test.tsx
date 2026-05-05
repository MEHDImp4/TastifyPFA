import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders range and handles page changes', () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        currentPage={2}
        totalPages={4}
        pageSize={10}
        totalItems={35}
        itemLabel="plats"
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText(/Affichage de/i)).toHaveTextContent('Affichage de 11 a 20 sur 35 plats');

    fireEvent.click(screen.getByRole('button', { name: /Page précédente/i }));
    fireEvent.click(screen.getByRole('button', { name: /Page suivante/i }));
    fireEvent.click(screen.getByRole('button', { name: /Page 4/i }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(3, 4);
  });
});
