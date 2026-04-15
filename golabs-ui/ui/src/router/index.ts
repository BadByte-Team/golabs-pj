import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/events',
    name: 'Events',
    component: () => import('@/views/Events.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/events/:id',
    name: 'EventDetail',
    component: () => import('@/views/EventDetail.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/events/:id/leaderboard',
    name: 'Leaderboard',
    component: () => import('@/views/Leaderboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// ── Navigation guards ──────────────────────────────────────────────────────────
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('access_token')
  const isAuthenticated = !!token

  // Redirect unauthenticated users to login
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/login')
  }

  // Redirect authenticated users away from login
  if (to.meta.guest && isAuthenticated) {
    return next('/dashboard')
  }

  // Admin-only route check
  if (to.meta.requiresAdmin && isAuthenticated) {
    try {
      const base64Url = token!.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      const payload = JSON.parse(json)
      if (payload.role !== 'admin') {
        return next('/dashboard')
      }
    } catch {
      return next('/dashboard')
    }
  }

  next()
})

export default router
