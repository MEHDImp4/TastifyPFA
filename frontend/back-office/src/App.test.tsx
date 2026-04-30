import { render, screen } from '@testing-library/react';
import { useAuthStore } from '@shared/auth/useAuthStore';
import App from './App';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@shared/auth/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock CategoriesPage
vi.mock('./pages/Categories', () => ({
  default: () => <div>Categories Page Content</div>,
}));

// Mock PlatsPage
vi.mock('./pages/Plats', () => ({
  default: () => <div>Plats Page Content</div>,
}));

// Mock Login
vi.mock('@shared/auth/Login', () => ({
  default: () => <div>Login Form</div>,
}));

describe('App Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset URL to root before each test
    window.history.pushState({}, 'Home', '/');
  });

  it('redirects to /login when unauthenticated', () => {
    (useAuthStore as any).mockReturnValue({ isAuthenticated: false });

    render(<App />);

    expect(screen.getByText('Login Form')).toBeInTheDocument();
  });

  it('redirects to /categories when authenticated and visiting root', async () => {
    (useAuthStore as any).mockReturnValue({ isAuthenticated: true });

    render(<App />);

    // Should see Categories Page Content due to redirect from / to /categories
    expect(screen.getByText('Categories Page Content')).toBeInTheDocument();
    // Should see Sidebar content
    expect(screen.getByText('Catégories')).toBeInTheDocument(); 
  });

  it('renders plats page when authenticated and visiting /plats', async () => {
    (useAuthStore as any).mockReturnValue({ isAuthenticated: true });
    window.history.pushState({}, 'Plats', '/plats');

    render(<App />);

    expect(screen.getByText('Plats Page Content')).toBeInTheDocument();
    expect(screen.getByText('Plats')).toBeInTheDocument();
  });
});
