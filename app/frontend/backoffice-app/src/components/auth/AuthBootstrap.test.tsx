import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthBootstrap } from './AuthBootstrap';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/axios';

vi.mock('../../api/axios', () => ({
  api: {
    post: vi.fn(),
  },
}));

const resetAuth = () => {
  useAuthStore.setState({
    accessToken: null,
    role: null,
    username: null,
    isAuthenticated: false,
    hasSession: false,
  });
};

beforeEach(() => {
  resetAuth();
  localStorage.clear();
  vi.clearAllMocks();
});

describe('AuthBootstrap', () => {
  it('refreshes a remembered session before rendering protected children', async () => {
    useAuthStore.setState({
      accessToken: 'stale-token',
      role: 'GERANT',
      username: 'gerant_test',
      isAuthenticated: true,
      hasSession: true,
    });

    let resolveRefresh!: (value: { data: { access: string; role: string; username: string } }) => void;
    vi.mocked(api.post).mockReturnValue(
      new Promise(resolve => {
        resolveRefresh = resolve;
      }) as ReturnType<typeof api.post>,
    );

    render(
      <AuthBootstrap>
        <div>Protected staff content</div>
      </AuthBootstrap>,
    );

    expect(screen.queryByText('Protected staff content')).toBeNull();
    expect(api.post).toHaveBeenCalledWith('/users/refresh/');

    resolveRefresh({
      data: { access: 'fresh-token', role: 'GERANT', username: 'gerant_test' },
    });

    await screen.findByText('Protected staff content');
    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe('fresh-token');
    });
  });

  it('clears a remembered session when refresh fails', async () => {
    useAuthStore.setState({
      accessToken: 'stale-token',
      role: 'SERVEUR',
      username: 'serveur_test',
      isAuthenticated: true,
      hasSession: true,
    });
    vi.mocked(api.post).mockRejectedValue(new Error('expired'));

    render(
      <AuthBootstrap>
        <div>Protected staff content</div>
      </AuthBootstrap>,
    );

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().hasSession).toBe(false);
    });
  });
});
