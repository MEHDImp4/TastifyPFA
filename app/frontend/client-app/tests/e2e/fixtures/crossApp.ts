const CLIENT_ORIGIN = 'http://127.0.0.1:3003';
const BACKOFFICE_ORIGIN = 'http://127.0.0.1:3000';
const BACKEND_ORIGIN = 'http://127.0.0.1:8000';

type PersistedAuthState = {
  accessToken: string;
  role: string;
  username: string;
};

function buildPersistedStorageState(origin: string, storageKey: string, auth: PersistedAuthState) {
  return {
    cookies: [] as never[],
    origins: [
      {
        origin,
        localStorage: [
          {
            name: storageKey,
            value: JSON.stringify({
              state: {
                accessToken: auth.accessToken,
                role: auth.role,
                username: auth.username,
                isAuthenticated: true,
                hasSession: true,
              },
              version: 0,
            }),
          },
        ],
      },
    ],
  };
}

export function buildClientBrowserStorageState(auth: PersistedAuthState) {
  return buildPersistedStorageState(CLIENT_ORIGIN, 'client-auth-storage', auth);
}

export function buildBackofficeBrowserStorageState(auth: PersistedAuthState) {
  return buildPersistedStorageState(BACKOFFICE_ORIGIN, 'backoffice-auth-storage', auth);
}

export function buildCrossAppIdentity() {
  const nonce = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
  const username = `cross_app_${nonce}`;

  return {
    username,
    email: `${username}@tastify.test`,
    password: `CrossApp!${nonce}`,
  };
}

export function buildFutureReservationDate(daysAhead = 7) {
  const target = new Date();
  target.setDate(target.getDate() + daysAhead);
  return target.toISOString().split('T')[0];
}

export function buildApiUrl(pathname: string) {
  return `${BACKEND_ORIGIN}${pathname}`;
}

export const CROSS_APP_ORIGINS = {
  client: CLIENT_ORIGIN,
  backoffice: BACKOFFICE_ORIGIN,
  backend: BACKEND_ORIGIN,
};
