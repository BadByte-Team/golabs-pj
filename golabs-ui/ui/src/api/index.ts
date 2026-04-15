import axios from 'axios'

// ── Axios instance targeting the Go backend ────────────────────────────────────
export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF defense-in-depth
  },
})

// ── Request interceptor: attach access token ───────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: automatic token refresh on 401 ───────────────────────
let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processPendingQueue(error: unknown, token: string | null): void {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token)
    else reject(error)
  })
  pendingQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only attempt refresh for 401 errors on non-auth endpoints
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.startsWith('/auth/')
    ) {
      return Promise.reject(error)
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(api(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      isRefreshing = false
      clearAndRedirect()
      return Promise.reject(error)
    }

    try {
      const res = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      )

      const { access_token, refresh_token: newRefresh } = res.data
      localStorage.setItem('access_token', access_token)
      if (newRefresh) localStorage.setItem('refresh_token', newRefresh)

      // Retry original request + flush queue
      originalRequest.headers.Authorization = `Bearer ${access_token}`
      processPendingQueue(null, access_token)
      return api(originalRequest)
    } catch (refreshError) {
      processPendingQueue(refreshError, null)
      clearAndRedirect()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

function clearAndRedirect(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  // Only redirect if not already on login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

export default api
