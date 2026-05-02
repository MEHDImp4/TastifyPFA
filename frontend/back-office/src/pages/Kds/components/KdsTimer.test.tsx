import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KdsTimer } from './KdsTimer';

describe('KdsTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates initial elapsed time correctly', () => {
    const startTime = new Date(Date.now() - 65000).toISOString(); // 1m 5s ago
    render(<KdsTimer startTime={startTime} />);
    
    expect(screen.getByTestId('kds-timer').textContent).toBe('1:05');
    expect(screen.getByTestId('kds-timer').className).toContain('text-teal');
  });

  it('updates every second', () => {
    const startTime = new Date().toISOString();
    render(<KdsTimer startTime={startTime} />);
    
    expect(screen.getByTestId('kds-timer').textContent).toBe('0:00');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('kds-timer').textContent).toBe('0:01');

    act(() => {
      vi.advanceTimersByTime(59000);
    });
    expect(screen.getByTestId('kds-timer').textContent).toBe('1:00');
  });

  it('changes color to amber after 10 minutes', () => {
    const startTime = new Date(Date.now() - 599000).toISOString(); // 9m 59s ago
    render(<KdsTimer startTime={startTime} />);
    
    expect(screen.getByTestId('kds-timer').className).toContain('text-teal');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(screen.getByTestId('kds-timer').textContent).toBe('10:00');
    expect(screen.getByTestId('kds-timer').className).toContain('text-amber');
  });

  it('changes color to red and pulses after 20 minutes', () => {
    const startTime = new Date(Date.now() - 1199000).toISOString(); // 19m 59s ago
    render(<KdsTimer startTime={startTime} />);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(screen.getByTestId('kds-timer').textContent).toBe('20:00');
    expect(screen.getByTestId('kds-timer').className).toContain('text-error');
    expect(screen.getByTestId('kds-timer').className).toContain('animate-pulse');
  });
});
