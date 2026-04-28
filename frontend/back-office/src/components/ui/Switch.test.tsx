import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch Component', () => {
  it('renders correctly with initial checked state', () => {
    render(<Switch checked={true} onToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-teal-500');
  });

  it('renders correctly with unchecked state', () => {
    render(<Switch checked={false} onToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-surface-elevated');
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<Switch checked={false} onToggle={onToggle} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
