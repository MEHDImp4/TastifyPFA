import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { getAuthPortalHeader, getPortalFromRole } from './portalContext'
import { useAuthStore } from './useAuthStore'

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
  __proxyRetryCount?: number
}

const PROXY_REQUEST_TIMEOUT_MS = 5000
const PROXY_RETRY_DELAYS_MS = [300, 900]
const RETRIABLE_PROXY_STATUSES = new Set([502, 503, 504])
const RETRIABLE_PROXY_CODES = new Set(['ECONNABORTED', 'ERR_NETWORK'])

const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: PROXY_REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

axiosInstance.interceptors.request.use(
  (config) => {
    const authState = useAuthStore.getState()
    const token = authState.accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const portal = getPortalFromRole(authState.user?.role)
    Object.assign(config.headers, getAuthPortalHeader(portal))
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let failedQueue: any[] = []

export const isRetriableProxyError = (error: unknown) => {
  const axiosError = error as AxiosError | undefined
  const status = axiosError?.response?.status

  if (typeof status === 'number') {
    return RETRIABLE_PROXY_STATUSES.has(status)
  }

  if (typeof axiosError?.code === 'string') {
    return RETRIABLE_PROXY_CODES.has(axiosError.code)
  }

  return false
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const retryProxyStartupRequest = async (error: AxiosError) => {
  const originalRequest = error.config as RetryableRequestConfig | undefined

  if (!originalRequest || !isRetriableProxyError(error)) {
    throw error
  }

  const attempt = originalRequest.__proxyRetryCount ?? 0
  const retryDelay = PROXY_RETRY_DELAYS_MS[attempt]

  if (retryDelay === undefined) {
    throw error
  }

  originalRequest.__proxyRetryCount = attempt + 1
  await wait(retryDelay)
  return axiosInstance(originalRequest)
}

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (isRetriableProxyError(error)) {
      try {
        return await retryProxyStartupRequest(error)
      } catch (retryError) {
        error = retryError
      }
    }

    const originalRequest = error.config as RetryableRequestConfig

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axiosInstance.post('/users/refresh/')
        const { access, role, username } = response.data

        useAuthStore
          .getState()
          .setAccessToken(access, role && username ? { role, username } : undefined)

        processQueue(null, access)

        originalRequest.headers.Authorization = `Bearer ${access}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().clearAuth()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
