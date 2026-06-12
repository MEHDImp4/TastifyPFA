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

export const buildStaffWebSocketUrl = (accessToken: string) => {
  const explicitWsBase = import.meta.env.VITE_WS_BASE_URL;
  const wsUrl = explicitWsBase
    ? new URL(explicitWsBase.replace(/\/+$/, '') + '/ws/staff/', window.location.origin)
    : new URL('/ws/staff/', getApiRootUrl());

  wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  wsUrl.searchParams.set('token', accessToken);
  return wsUrl.toString();
};
