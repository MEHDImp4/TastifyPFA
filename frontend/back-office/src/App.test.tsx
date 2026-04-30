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

vi.mock('./pages/Tables', () => ({
  default: () => <div>Tables Page Content</div>,
}));

vi.mock('./pages/Staff/Map/MapView', () => ({
  MapView: () => <div>Salle Page Content</div>,
}));

vi.mock('./pages/Staff/Ordering/OrderingPage', () => ({
  OrderingPage: () => <div>Ordering Page Content</div>,
}));

vi.mock('./pages/Staff/KdsPage', () => ({
  KdsPage: () => <div>KDS Page Content</div>,
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
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      user: { username: 'gerant_test', role: 'GERANT' },
    });

    render(<App />);

    // Should see Categories Page Content due to redirect from / to /categories
    expect(screen.getByText('Categories Page Content')).toBeInTheDocument();
    // Should see Sidebar content
    expect(screen.getByText('Catégories')).toBeInTheDocument(); 
  });

  it('renders plats page when authenticated and visiting /plats', async () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      user: { username: 'gerant_test', role: 'GERANT' },
    });
    window.history.pushState({}, 'Plats', '/plats');

    render(<App />);

    expect(screen.getByText('Plats Page Content')).toBeInTheDocument();
    expect(screen.getByText('Plats')).toBeInTheDocument();
  });

  it('redirects serveur users from root to /salle', async () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      user: { username: 'serveur_test', role: 'SERVEUR' },
    });

    render(<App />);

    expect(await screen.findByText('Salle Page Content')).toBeInTheDocument();
    expect(screen.getByText('Salle')).toBeInTheDocument();
    expect(screen.queryByText('Catégories')).not.toBeInTheDocument();
  });

  it('blocks serveur users from gerant-only routes', async () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      user: { username: 'serveur_test', role: 'SERVEUR' },
    });
    window.history.pushState({}, 'Categories', '/categories');

    render(<App />);

    expect(await screen.findByText('Salle Page Content')).toBeInTheDocument();
    expect(screen.queryByText('Categories Page Content')).not.toBeInTheDocument();
  });
});
