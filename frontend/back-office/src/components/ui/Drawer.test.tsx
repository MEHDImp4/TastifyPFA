import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Drawer } from './Drawer';

describe('Drawer Component', () => {
  it('renders content when isOpen is true', () => {
    render(
      <Drawer isOpen={true} onClose={() => {}}>
        <div>Drawer Content</div>
      </Drawer>
    );
    expect(screen.getByText('Drawer Content')).toBeInTheDocument();
  });

  it('does not render content when isOpen is false', () => {
    render(
      <Drawer isOpen={false} onClose={() => {}}>
        <div>Drawer Content</div>
      </Drawer>
    );
    expect(screen.queryByText('Drawer Content')).not.toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(
      <Drawer isOpen={true} onClose={onClose}>
        <div>Drawer Content</div>
      </Drawer>
    );
    // Find overlay by role or generic tag if no role assigned
    // Given the task description, it's a fixed inset-0 bg-black/50
    // We can add a data-testid or role for testing
    const overlay = screen.getByTestId('drawer-overlay');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
