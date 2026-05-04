import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch Component', () => {
  it('renders correctly with initial checked state', () => {
    render(<Switch checked={true} onToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-teal-500');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders correctly with unchecked state', () => {
    render(<Switch checked={false} onToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-surface-elevated');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<Switch checked={false} onToggle={onToggle} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const onToggle = vi.fn();
    render(<Switch checked={false} onToggle={onToggle} disabled={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50');
    fireEvent.click(button);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('renders with label', () => {
    render(<Switch checked={false} onToggle={() => {}} label="Toggle me" />);
    expect(screen.getByText('Toggle me')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /toggle me/i })).toBeInTheDocument();
  });
});
