export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const getApiRootUrl = () => {
  const apiUrl = new URL(API_BASE_URL, window.location.origin);
  apiUrl.pathname = apiUrl.pathname.replace(/\/api\/?$/, '') || '/';
  apiUrl.search = '';
  apiUrl.hash = '';
  return apiUrl;
};

export const buildApiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const resolveMediaUrl = (url: string | null) => {
  if (!url || /^(https?:|blob:|data:)/i.test(url)) return url;
  if (!url.startsWith('/media/')) return url;

  const apiRoot = getApiRootUrl();
  return new URL(url, apiRoot).toString();
};

const withTrailingSlash = (value: string) => value.replace(/\/+$/, '') + '/';

const normalizeStaffWebSocketPath = (path: string | undefined) => {
  const value = (path || '/ws/staff/').trim() || '/ws/staff/';
  return value.replace(/^\/+/, '');
};

export const buildStaffWebSocketUrl = (accessToken: string) => {
  if (!accessToken.trim()) {
    throw new Error('Cannot build staff WebSocket URL without an access token.');
  }

  const explicitWsBase = import.meta.env.VITE_WS_BASE_URL?.trim();
  const wsBase = explicitWsBase
    ? new URL(withTrailingSlash(explicitWsBase), window.location.origin)
    : getApiRootUrl();
  const wsUrl = new URL(
    normalizeStaffWebSocketPath(import.meta.env.VITE_STAFF_WS_PATH),
    withTrailingSlash(wsBase.toString()),
  );

  if (wsUrl.protocol === 'https:') {
    wsUrl.protocol = 'wss:';
  } else if (wsUrl.protocol === 'http:') {
    wsUrl.protocol = 'ws:';
  }

  wsUrl.searchParams.set('access_token', accessToken);
  return wsUrl.toString();
};
