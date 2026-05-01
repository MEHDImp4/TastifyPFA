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
    
    expect(screen.getByText('1:05')).toBeDefined();
    expect(screen.getByTestId('kds-timer').className).toContain('text-teal');
  });

  it('updates every second', () => {
    const startTime = new Date().toISOString();
    render(<KdsTimer startTime={startTime} />);
    
    expect(screen.getByText('0:00')).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('0:01')).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(59000);
    });
    expect(screen.getByText('1:00')).toBeDefined();
  });

  it('changes color to amber after 10 minutes', () => {
    const startTime = new Date(Date.now() - 599000).toISOString(); // 9m 59s ago
    render(<KdsTimer startTime={startTime} />);
    
    expect(screen.getByTestId('kds-timer').className).toContain('text-teal');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(screen.getByText('10:00')).toBeDefined();
    expect(screen.getByTestId('kds-timer').className).toContain('text-amber');
  });

  it('changes color to red and pulses after 20 minutes', () => {
    const startTime = new Date(Date.now() - 1199000).toISOString(); // 19m 59s ago
    render(<KdsTimer startTime={startTime} />);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(screen.getByText('20:00')).toBeDefined();
    expect(screen.getByTestId('kds-timer').className).toContain('text-red');
    expect(screen.getByTestId('kds-timer').className).toContain('animate-pulse');
  });
});
