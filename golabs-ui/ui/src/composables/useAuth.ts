import { ref, computed, readonly } from 'vue'
import { api } from '@/api'
import router from '@/router'

// ── Types ──────────────────────────────────────────────────────────────────────
interface TokenPayload {
  sub: string
  role: 'admin' | 'user'
  iss?: string
  exp?: number
}

interface UserState {
  id: string
  role: 'admin' | 'user'
}

// ── Singleton state (shared across all components) ─────────────────────────────
const user = ref<UserState | null>(null)
const loading = ref(false)

// ── Helpers ────────────────────────────────────────────────────────────────────
function decodeToken(token: string): TokenPayload | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json) as TokenPayload
  } catch {
    return null
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload?.exp) return true
  // Add 10-second buffer
  return Date.now() >= (payload.exp - 10) * 1000
}

function loadUserFromStorage(): void {
  const token = localStorage.getItem('access_token')
  if (token && !isTokenExpired(token)) {
    const payload = decodeToken(token)
    if (payload) {
      user.value = { id: payload.sub, role: payload.role }
      return
    }
  }
  user.value = null
}

// Initialize on module load
loadUserFromStorage()

// ── Composable ─────────────────────────────────────────────────────────────────
export function useAuth() {
  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const userId = computed(() => user.value?.id ?? '')

  async function login(identifier: string, password: string): Promise<void> {
    loading.value = true
    try {
      const res = await api.post('/auth/login', { identifier, password })
      const { access_token, refresh_token } = res.data
      if (!access_token) throw new Error('No access token received')
      localStorage.setItem('access_token', access_token)
      if (refresh_token) localStorage.setItem('refresh_token', refresh_token)
      loadUserFromStorage()
    } finally {
      loading.value = false
    }
  }

  async function register(username: string, email: string, password: string): Promise<void> {
    loading.value = true
    try {
      await api.post('/auth/register', { username, email, password })
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token')
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken })
      }
    } catch {
      // Logout endpoint is idempotent — ignore errors
    } finally {
      clearSession()
    }
  }

  function clearSession(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    user.value = null
    router.push('/login')
  }

  /** Re-read user state from current token */
  function refresh(): void {
    loadUserFromStorage()
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    isAuthenticated,
    isAdmin,
    userId,
    login,
    register,
    logout,
    clearSession,
    refresh,
    decodeToken,
  }
}
