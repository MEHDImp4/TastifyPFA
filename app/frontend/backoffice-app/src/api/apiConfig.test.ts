import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildStaffWebSocketUrl } from './apiConfig';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('buildStaffWebSocketUrl', () => {
  it('builds a same-origin secure staff websocket URL by default', () => {
    window.history.pushState({}, '', '/dashboard');

    const url = new URL(buildStaffWebSocketUrl('jwt.value'));

    expect(url.protocol).toBe(window.location.protocol === 'https:' ? 'wss:' : 'ws:');
    expect(url.host).toBe(window.location.host);
    expect(url.pathname).toBe('/ws/staff/');
    expect(url.searchParams.get('access_token')).toBe('jwt.value');
    expect(url.searchParams.has('token')).toBe(false);
  });

  it('uses explicit websocket base and path when configured at build time', () => {
    vi.stubEnv('VITE_WS_BASE_URL', 'https://api.example.com');
    vi.stubEnv('VITE_STAFF_WS_PATH', '/notifications/hub');

    const url = new URL(buildStaffWebSocketUrl('jwt.value'));

    expect(url.origin).toBe('wss://api.example.com');
    expect(url.pathname).toBe('/notifications/hub');
    expect(url.searchParams.get('access_token')).toBe('jwt.value');
  });

  it('rejects empty access tokens before opening a websocket', () => {
    expect(() => buildStaffWebSocketUrl('   ')).toThrow('access token');
  });
});
