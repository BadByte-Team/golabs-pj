<template>
  <v-app-bar app color="#0a0e17" elevation="4" class="border-b" style="border-bottom: 1px solid rgba(0, 230, 118, 0.2) !important;" v-if="!isLoginRoute">
    <v-container class="d-flex align-center py-0 fill-height" fluid>
      
      <!-- Brand Logo / Name -->
      <div 
        class="d-flex align-center" 
        style="cursor: pointer;" 
        @click="router.push('/dashboard')"
      >
        <v-icon color="primary" class="mr-2 glow-icon">mdi-shield-lock-outline</v-icon>
        <v-app-bar-title class="font-weight-black text-h6 text-md-h5 ctf-brand mb-0">
          BADBYTE <span class="text-primary">CTF</span>
        </v-app-bar-title>
      </div>

      <v-spacer class="d-none d-sm-block"></v-spacer>

      <!-- Global Search -->
      <div class="d-none d-md-block mr-4" style="max-width: 280px; width: 100%;">
        <v-text-field
          v-model="searchQuery"
          density="compact"
          variant="outlined"
          placeholder="Search users or events..."
          prepend-inner-icon="mdi-magnify"
          hide-details
          clearable
          @keyup.enter="executeSearch"
        ></v-text-field>

        <!-- Search Results Dropdown -->
        <v-menu
          v-model="showResults"
          :close-on-content-click="true"
          location="bottom"
          transition="scale-transition"
          activator="parent"
          max-height="400"
          min-width="280"
        >
          <v-list bg-color="#0a0e17" class="search-results-list" density="compact" rounded="lg">
            <v-list-subheader v-if="userResults.length > 0" class="text-primary font-weight-bold text-uppercase" style="letter-spacing: 2px;">
              <v-icon size="small" class="mr-1">mdi-account-group</v-icon>Users
            </v-list-subheader>
            <v-list-item
              v-for="u in userResults"
              :key="'user-' + u.id"
              @click="goToProfile(u.id)"
            >
              <template v-slot:prepend>
                <v-avatar color="primary" size="28" class="mr-2 text-caption font-weight-bold text-black">
                  {{ u.username.charAt(0).toUpperCase() }}
                </v-avatar>
              </template>
              <v-list-item-title class="text-white">{{ u.username }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption text-uppercase" :class="u.role === 'admin' ? 'text-error' : 'text-grey'">
                {{ u.role }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider v-if="userResults.length > 0 && eventResults.length > 0" class="my-1 border-opacity-25"></v-divider>

            <v-list-subheader v-if="eventResults.length > 0" class="text-secondary font-weight-bold text-uppercase" style="letter-spacing: 2px;">
              <v-icon size="small" class="mr-1">mdi-calendar-star</v-icon>Events
            </v-list-subheader>
            <v-list-item
              v-for="ev in eventResults"
              :key="'event-' + ev.id"
              @click="goToEvent(ev.id)"
            >
              <template v-slot:prepend>
                <v-icon color="secondary" size="small" class="mr-2">mdi-flag-checkered</v-icon>
              </template>
              <v-list-item-title class="text-white">{{ ev.name }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption text-uppercase" :class="getStatusClass(ev.status)">
                {{ ev.status }}
              </v-list-item-subtitle>
            </v-list-item>

            <!-- No results -->
            <v-list-item v-if="searchDone && userResults.length === 0 && eventResults.length === 0">
              <v-list-item-title class="text-grey text-center text-caption">No results found.</v-list-item-title>
            </v-list-item>

            <!-- Loading -->
            <v-list-item v-if="searchLoading">
              <div class="d-flex justify-center py-2">
                <v-progress-circular indeterminate size="20" width="2" color="primary"></v-progress-circular>
              </div>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <v-spacer class="d-sm-none"></v-spacer>

      <!-- Desktop Menu -->
      <div class="d-none d-md-flex align-center">
        <v-btn 
          variant="text" 
          prepend-icon="mdi-view-dashboard" 
          to="/dashboard" 
          class="nav-btn mx-1"
          active-class="text-primary font-weight-bold"
        >
          Dashboard
        </v-btn>
        
        <v-btn 
          variant="text" 
          prepend-icon="mdi-calendar-star" 
          to="/events" 
          class="nav-btn mx-1"
          active-class="text-primary font-weight-bold"
        >
          Events
        </v-btn>

        <v-btn 
          variant="text" 
          prepend-icon="mdi-account-circle" 
          to="/profile" 
          class="nav-btn mx-1"
          active-class="text-primary font-weight-bold"
        >
          Profile
        </v-btn>
        
        <v-slide-x-transition>
          <v-btn 
            v-if="isAdmin" 
            color="error" 
            variant="outlined" 
            prepend-icon="mdi-shield-crown" 
            to="/admin" 
            class="admin-btn mx-2 font-weight-bold"
            active-class="bg-error text-white"
          >
            Admin Panel
          </v-btn>
        </v-slide-x-transition>

        <v-btn 
          variant="outlined" 
          color="primary" 
          @click="handleLogout" 
          prepend-icon="mdi-logout" 
          class="logout-btn mx-1 ml-4"
        >
          Disconnect
        </v-btn>
      </div>

      <!-- Mobile Menu -->
      <div class="d-md-none">
        <v-menu
          v-model="mobileMenu"
          :close-on-content-click="false"
          transition="scale-transition"
          location="bottom end"
        >
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-menu" variant="text" color="primary" v-bind="props"></v-btn>
          </template>

          <v-list bg-color="#0a0e17" rounded="lg" elevation="8" class="mobile-menu-list border mt-2">
            <v-list-item to="/dashboard" prepend-icon="mdi-view-dashboard" @click="mobileMenu = false" active-class="text-primary">
              <v-list-item-title>Dashboard</v-list-item-title>
            </v-list-item>

            <v-list-item to="/events" prepend-icon="mdi-calendar-star" @click="mobileMenu = false" active-class="text-primary">
              <v-list-item-title>Events</v-list-item-title>
            </v-list-item>

            <v-list-item to="/profile" prepend-icon="mdi-account-circle" @click="mobileMenu = false" active-class="text-primary">
              <v-list-item-title>Profile</v-list-item-title>
            </v-list-item>
            
            <v-divider class="my-1 border-opacity-25" color="primary"></v-divider>
            
            <v-list-item v-if="isAdmin" to="/admin" prepend-icon="mdi-shield-crown" @click="mobileMenu = false" active-class="text-error">
              <v-list-item-title class="text-error font-weight-bold">Admin Panel</v-list-item-title>
            </v-list-item>
            
            <v-divider v-if="isAdmin" class="my-1 border-opacity-25" color="error"></v-divider>
            
            <v-list-item @click="handleLogout(); mobileMenu = false" prepend-icon="mdi-logout" class="mt-2">
              <v-list-item-title class="text-primary font-weight-bold">Disconnect</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-container>
  </v-app-bar>
</template>

<script setup>
import { ref, computed, watch, watchEffect } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { api } from '@/api'

const router = useRouter()
const route = useRoute()
const mobileMenu = ref(false)
const { isAdmin, logout, refresh } = useAuth()

// ── Search ─────────────────────────────────────────────────────────────────────
const searchQuery = ref('')
const searchLoading = ref(false)
const searchDone = ref(false)
const showResults = ref(false)
const userResults = ref([])
const eventResults = ref([])
let debounceTimer = null

const getStatusClass = (status) => {
  switch (status) {
    case 'running': return 'text-success'
    case 'open': return 'text-primary'
    case 'finished': return 'text-grey'
    default: return 'text-warning'
  }
}

// Debounced search watcher
watch(searchQuery, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  
  if (!val || val.length < 2) {
    userResults.value = []
    eventResults.value = []
    showResults.value = false
    searchDone.value = false
    return
  }

  debounceTimer = setTimeout(() => {
    executeSearch()
  }, 400)
})

const executeSearch = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) return
  
  searchLoading.value = true
  searchDone.value = false
  showResults.value = true

  try {
    // Fetch users and events in parallel
    const [usersRes, eventsRes] = await Promise.allSettled([
      api.get(`/users/search?q=${encodeURIComponent(searchQuery.value)}`),
      api.get('/events')
    ])

    // Users
    if (usersRes.status === 'fulfilled') {
      const data = usersRes.value.data.data || usersRes.value.data || []
      userResults.value = Array.isArray(data) ? data.slice(0, 5) : []
    } else {
      userResults.value = []
    }

    // Events — filter client-side by name match
    if (eventsRes.status === 'fulfilled') {
      const allEvents = eventsRes.value.data.data || eventsRes.value.data || []
      const q = searchQuery.value.toLowerCase()
      eventResults.value = (Array.isArray(allEvents) ? allEvents : [])
        .filter(ev => (ev.name || '').toLowerCase().includes(q))
        .slice(0, 5)
    } else {
      eventResults.value = []
    }
  } catch {
    userResults.value = []
    eventResults.value = []
  } finally {
    searchLoading.value = false
    searchDone.value = true
  }
}

const goToProfile = (id) => {
  router.push({ path: '/profile', query: { id } })
  resetSearch()
}

const goToEvent = (id) => {
  router.push(`/events/${id}`)
  resetSearch()
}

const resetSearch = () => {
  searchQuery.value = ''
  userResults.value = []
  eventResults.value = []
  showResults.value = false
  searchDone.value = false
}

// ── Nav logic ──────────────────────────────────────────────────────────────────
const isLoginRoute = computed(() => route.path === '/login' || route.path === '/')

// Re-check role whenever the route changes (handles fresh login)
watchEffect(() => {
  if (!isLoginRoute.value) {
    refresh()
  }
})

const handleLogout = async () => {
  await logout()
}
</script>

<style scoped>
.ctf-brand {
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(0, 230, 118, 0.4);
}

.glow-icon {
  filter: drop-shadow(0 0 10px rgba(0, 230, 118, 0.6));
}

.nav-btn {
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  text-shadow: 0 0 8px rgba(0, 230, 118, 0.5);
}

.admin-btn {
  text-transform: uppercase;
  letter-spacing: 1px;
  border: 1px solid rgba(255, 23, 68, 0.5);
  box-shadow: 0 0 10px rgba(255, 23, 68, 0.2);
  transition: all 0.3s ease;
}

.admin-btn:hover {
  background: rgba(255, 23, 68, 0.1);
  box-shadow: 0 0 15px rgba(255, 23, 68, 0.4);
}

.logout-btn {
  text-transform: uppercase;
  letter-spacing: 1px;
  border-width: 1px !important;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(0, 230, 118, 0.1);
  box-shadow: 0 0 15px rgba(0, 230, 118, 0.3);
}

.mobile-menu-list {
  border: 1px solid rgba(0, 230, 118, 0.3) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6) !important;
}

.search-results-list {
  border: 1px solid rgba(0, 230, 118, 0.25) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8) !important;
}
</style>
