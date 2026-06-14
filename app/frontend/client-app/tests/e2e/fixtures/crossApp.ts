const CLIENT_ORIGIN = process.env.CLIENT_BASE_URL ?? 'http://127.0.0.1:3003';
const BACKOFFICE_ORIGIN = process.env.BACKOFFICE_BASE_URL ?? 'http://127.0.0.1:3000';
const BACKEND_ORIGIN = process.env.BACKEND_BASE_URL ?? 'http://127.0.0.1:8000';

type PersistedAuthState = {
  accessToken: string;
  role: string;
  username: string;
};

function buildPersistedStorageState(
  origin: string,
  storageKey: string,
  auth: PersistedAuthState,
  options: { hasSession?: boolean } = {},
) {
  const localStorageItems = [
    {
      name: storageKey,
      value: JSON.stringify({
        state: {
          accessToken: auth.accessToken,
          role: auth.role,
          username: auth.username,
          isAuthenticated: true,
          hasSession: options.hasSession ?? true,
        },
        version: 0,
      }),
    },
  ];

  if (origin === CLIENT_ORIGIN) {
    localStorageItems.push({
      name: 'tastify_cookie_consent',
      value: JSON.stringify({ accepted: true, date: Date.now() }),
    });
  }

  return {
    cookies: [] as never[],
    origins: [
      {
        origin,
        localStorage: localStorageItems,
      },
    ],
  };
}

export function buildClientBrowserStorageState(auth: PersistedAuthState) {
  return buildPersistedStorageState(CLIENT_ORIGIN, 'client-auth-storage', auth);
}

export function buildBackofficeBrowserStorageState(auth: PersistedAuthState) {
  return buildPersistedStorageState(BACKOFFICE_ORIGIN, 'backoffice-auth-storage', auth, { hasSession: false });
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
