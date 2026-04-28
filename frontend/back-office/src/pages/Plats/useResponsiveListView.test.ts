import { renderHook, act } from '@testing-library/react';
import { useResponsiveListView } from './useResponsiveListView';
import { describe, it, expect, vi } from 'vitest';

describe('useResponsiveListView', () => {
  it('returns desktop when width is above breakpoint', () => {
    // Mock window.innerWidth
    vi.stubGlobal('innerWidth', 1024);
    
    const { result } = renderHook(() => useResponsiveListView(768));
    expect(result.current).toBe('desktop');
  });

  it('returns mobile when width is below breakpoint', () => {
    vi.stubGlobal('innerWidth', 375);
    
    const { result } = renderHook(() => useResponsiveListView(768));
    expect(result.current).toBe('mobile');
  });

  it('updates when window is resized', () => {
    vi.stubGlobal('innerWidth', 1024);
    const { result } = renderHook(() => useResponsiveListView(768));
    expect(result.current).toBe('desktop');

    act(() => {
      vi.stubGlobal('innerWidth', 500);
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe('mobile');
  });
});
