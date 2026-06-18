export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
export const MEDIA_BASE_URL = (import.meta.env.VITE_MEDIA_BASE_URL || '').trim().replace(/\/+$/, '');

const getApiRootUrl = () => {
  const apiUrl = new URL(API_BASE_URL, window.location.origin);
  apiUrl.pathname = apiUrl.pathname.replace(/\/api\/?$/, '') || '/';
  apiUrl.search = '';
  apiUrl.hash = '';
  return apiUrl;
};

const getMediaRootUrl = () => {
  if (!MEDIA_BASE_URL) return getApiRootUrl();

  const mediaUrl = new URL(MEDIA_BASE_URL, window.location.origin);
  mediaUrl.search = '';
  mediaUrl.hash = '';
  return mediaUrl;
};

export const buildApiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const resolveMediaUrl = (url: string | null) => {
  if (!url || /^(https?:|blob:|data:)/i.test(url)) return url;

  if (url.startsWith('//')) {
    return `${window.location.protocol}${url}`;
  }

  if (url.startsWith('/media/') || url.startsWith('media/')) {
    return new URL(url.startsWith('/') ? url : `/${url}`, getMediaRootUrl()).toString();
  }

  if (url.startsWith('/')) {
    return new URL(url, window.location.origin).toString();
  }

  return new URL(url, getApiRootUrl()).toString();
};
