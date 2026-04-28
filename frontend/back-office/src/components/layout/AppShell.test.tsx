import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './AppShell';
import { useAuthStore } from '@shared/auth/useAuthStore';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@shared/auth/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users to /login', () => {
    (useAuthStore as any).mockReturnValue({ isAuthenticated: false });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<div>Home</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders Sidebar and Outlet for authenticated users', () => {
    (useAuthStore as any).mockReturnValue({ isAuthenticated: true });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('links Tables navigation to the Salle table map app', () => {
    (useAuthStore as any).mockReturnValue({ isAuthenticated: true });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /tables/i })).toHaveAttribute('href', '/salle/');
  });

  it('toggles sidebar on mobile', () => {
    (useAuthStore as any).mockReturnValue({ isAuthenticated: true });
    
    // Mock mobile width
    vi.stubGlobal('innerWidth', 375);

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Sidebar should be off-screen
    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toHaveClass('-translate-x-full');

    // Click hamburger
    const openButton = screen.getByRole('button', { name: /open sidebar/i });
    fireEvent.click(openButton);

    // Sidebar should be visible
    expect(sidebar).toHaveClass('translate-x-0');

    // Click close button in sidebar
    const closeButton = screen.getByRole('button', { name: /close sidebar/i });
    fireEvent.click(closeButton);

    // Sidebar should be off-screen again
    expect(sidebar).toHaveClass('-translate-x-full');
  });
});
