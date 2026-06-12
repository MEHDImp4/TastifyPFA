import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL, buildApiUrl } from './apiConfig';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Tastify-Portal': 'staff',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not intercept login or refresh failures to prevent infinite loops
    if (originalRequest.url?.includes('/users/login/') || originalRequest.url?.includes('/users/refresh/')) {
        return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(buildApiUrl('/users/refresh/'), {}, {
          withCredentials: true,
          headers: { 'X-Tastify-Portal': 'staff' }
        });
        const { access, role, username } = response.data;
        useAuthStore.getState().setAuth(access, role, username);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        processQueue(null, access);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().logoutLocally();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
