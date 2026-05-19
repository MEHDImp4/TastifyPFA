import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './authStore';

vi.mock('../api/axios', () => ({
  api: {
    post: vi.fn().mockResolvedValue({}),
  },
}));

const reset = () =>
  useAuthStore.setState({
    accessToken: null,
    role: null,
    username: null,
    isAuthenticated: false,
    hasSession: false,
  });

beforeEach(reset);

describe('authStore — initial state', () => {
  it('starts unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.role).toBeNull();
    expect(state.username).toBeNull();
    expect(state.hasSession).toBe(false);
  });
});

describe('authStore — setAuth', () => {
  it('marks the user as authenticated and stores credentials', () => {
    useAuthStore.getState().setAuth('tok-abc', 'GERANT', 'gerant_test');
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.hasSession).toBe(true);
    expect(state.accessToken).toBe('tok-abc');
    expect(state.role).toBe('GERANT');
    expect(state.username).toBe('gerant_test');
  });

  it('replaces existing credentials on a second setAuth call', () => {
    useAuthStore.getState().setAuth('old-tok', 'SERVEUR', 'serveur_test');
    useAuthStore.getState().setAuth('new-tok', 'GERANT', 'gerant_test');
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-tok');
    expect(state.role).toBe('GERANT');
    expect(state.username).toBe('gerant_test');
  });
});

describe('authStore — logoutLocally', () => {
  it('clears all auth fields without calling the API', () => {
    useAuthStore.getState().setAuth('tok', 'CUISINIER', 'chef');
    useAuthStore.getState().logoutLocally();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.hasSession).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.role).toBeNull();
    expect(state.username).toBeNull();
  });
});

describe('authStore — logout (async)', () => {
  it('clears auth state after a successful API logout', async () => {
    const { api } = await import('../api/axios');
    vi.mocked(api.post).mockResolvedValueOnce({});

    useAuthStore.getState().setAuth('tok', 'GERANT', 'gerant_test');
    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });

  it('still clears auth state when the logout API call fails', async () => {
    const { api } = await import('../api/axios');
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'));

    useAuthStore.getState().setAuth('tok', 'SERVEUR', 'serveur_test');
    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });
});

describe('authStore — persistence', () => {
  it('uses the correct localStorage key', () => {
    useAuthStore.getState().setAuth('tok', 'GERANT', 'gerant_test');
    const raw = localStorage.getItem('backoffice-auth-storage');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.isAuthenticated).toBe(true);
    expect(parsed.state.accessToken).toBe('tok');
  });

  it('does not leak credentials across resets', () => {
    useAuthStore.getState().setAuth('tok', 'GERANT', 'g');
    reset();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
