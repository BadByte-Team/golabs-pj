<template>
  <v-container class="py-10 dashboard-page">
    <!-- Welcome Header -->
    <div class="mb-10">
      <h1 class="text-h3 font-weight-black text-white mb-2 ctf-header">
        Welcome back<span v-if="profile" class="text-primary">, {{ profile.username }}</span>
      </h1>
      <p class="text-grey-lighten-1 text-body-1">Your command center for all GoLabs CTF operations.</p>
    </div>

    <!-- Stats Row -->
    <v-row class="mb-8">
      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-panel text-center pa-6" rounded="xl">
          <v-icon size="40" color="primary" class="mb-3">mdi-trophy</v-icon>
          <div class="text-h4 font-weight-black text-primary">{{ profile?.points ?? 0 }}</div>
          <div class="text-caption text-grey-lighten-1 text-uppercase mt-1" style="letter-spacing: 2px;">Points</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-panel text-center pa-6" rounded="xl">
          <v-icon size="40" color="secondary" class="mb-3">mdi-shield-check</v-icon>
          <div class="text-h4 font-weight-black text-secondary text-uppercase">{{ profile?.role ?? '—' }}</div>
          <div class="text-caption text-grey-lighten-1 text-uppercase mt-1" style="letter-spacing: 2px;">Role</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-panel text-center pa-6" rounded="xl">
          <v-icon size="40" color="warning" class="mb-3">mdi-calendar-star</v-icon>
          <div class="text-h4 font-weight-black text-warning">{{ events.length }}</div>
          <div class="text-caption text-grey-lighten-1 text-uppercase mt-1" style="letter-spacing: 2px;">Events</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-panel text-center pa-6" rounded="xl">
          <v-icon size="40" color="info" class="mb-3">mdi-clock-outline</v-icon>
          <div class="text-h5 font-weight-black text-info">{{ memberSince }}</div>
          <div class="text-caption text-grey-lighten-1 text-uppercase mt-1" style="letter-spacing: 2px;">Joined</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <h2 class="text-h5 font-weight-bold text-white mb-4" style="letter-spacing: 1px;">Quick Access</h2>
    <v-row class="mb-10">
      <v-col cols="12" sm="6" md="4">
        <v-card class="glass-panel action-card pa-6" rounded="xl" hover @click="router.push('/events')">
          <div class="d-flex align-center mb-3">
            <v-icon size="32" color="primary" class="mr-3">mdi-calendar-star</v-icon>
            <span class="text-h6 font-weight-bold text-white">Events</span>
          </div>
          <p class="text-body-2 text-grey-lighten-1 mb-0">Browse active CTF events, join teams, and compete.</p>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card class="glass-panel action-card pa-6" rounded="xl" hover @click="router.push('/profile')">
          <div class="d-flex align-center mb-3">
            <v-icon size="32" color="secondary" class="mr-3">mdi-account-circle</v-icon>
            <span class="text-h6 font-weight-bold text-white">Profile</span>
          </div>
          <p class="text-body-2 text-grey-lighten-1 mb-0">View and update your profile, change password.</p>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4" v-if="isAdmin">
        <v-card class="glass-panel admin-action-card pa-6" rounded="xl" hover @click="router.push('/admin')">
          <div class="d-flex align-center mb-3">
            <v-icon size="32" color="error" class="mr-3">mdi-shield-crown</v-icon>
            <span class="text-h6 font-weight-bold text-error">Admin Panel</span>
          </div>
          <p class="text-body-2 text-grey-lighten-1 mb-0">Manage users, events, and challenges.</p>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Events -->
    <div class="d-flex justify-space-between align-center mb-4">
      <h2 class="text-h5 font-weight-bold text-white" style="letter-spacing: 1px;">Recent Events</h2>
      <v-btn variant="text" color="primary" to="/events" append-icon="mdi-arrow-right" class="font-weight-bold">View All</v-btn>
    </div>

    <v-row v-if="loadingEvents">
      <v-col cols="12" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="48" width="4"></v-progress-circular>
      </v-col>
    </v-row>

    <v-row v-else-if="events.length === 0">
      <v-col cols="12">
        <v-card class="glass-panel pa-10 text-center" rounded="xl" style="border-style: dashed !important; border-width: 2px !important;">
          <v-icon size="64" color="grey-darken-2" class="mb-4">mdi-server-network-off</v-icon>
          <h3 class="text-h6 text-grey-lighten-1">No CTF events found</h3>
          <p class="text-grey mt-2">Check back later for new challenges.</p>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col v-for="event in recentEvents" :key="event.id" cols="12" md="6" lg="4">
        <v-card class="glass-panel event-card" hover rounded="xl" :border="getStatusColor(event.status)">
          <v-card-title class="text-h6 font-weight-bold pt-5 px-5 text-primary d-flex justify-space-between">
            {{ event.name || event.title || 'Unnamed Event' }}
            <v-chip :color="getStatusColor(event.status)" size="x-small" class="font-weight-bold text-uppercase" variant="flat">
              {{ event.status }}
            </v-chip>
          </v-card-title>
          
          <v-card-text class="px-5 pb-2">
            <p class="text-body-2 text-grey-lighten-2 mb-3 description-text">
              {{ event.description || 'No description provided.' }}
            </p>
            <div class="text-caption text-grey">
              <v-icon size="small" class="mr-1">mdi-clock-start</v-icon>
              {{ new Date(event.starts_at).toLocaleDateString() }}
              <span class="mx-2">→</span>
              <v-icon size="small" class="mr-1" color="error">mdi-clock-end</v-icon>
              {{ new Date(event.ends_at).toLocaleDateString() }}
            </div>
          </v-card-text>
          
          <v-divider color="primary" class="mx-4 border-opacity-25"></v-divider>
          
          <v-card-actions class="pa-4">
            <v-btn color="primary" block variant="flat" size="small" class="font-weight-bold" :to="`/events/${event.id}`">
              VIEW DETAILS
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { api } from '@/api'

const router = useRouter()
const { userId, isAdmin } = useAuth()

const profile = ref(null)
const events = ref([])
const loadingEvents = ref(true)

const recentEvents = computed(() => events.value.slice(0, 3))

const memberSince = computed(() => {
  if (!profile.value?.created_at) return '—'
  return new Date(profile.value.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
})

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'open': return 'primary'
    case 'running': return 'success'
    case 'finished': return 'grey'
    case 'draft': default: return 'warning'
  }
}

const fetchProfile = async () => {
  try {
    const res = await api.get(`/users/${userId.value}`)
    profile.value = res.data
  } catch {
    // Silently fail — user info is supplementary
  }
}

const fetchEvents = async () => {
  try {
    loadingEvents.value = true
    const res = await api.get('/events')
    const all = res.data.data || res.data || []
    // Non-admin users should only see running and finished events
    events.value = isAdmin.value ? all : all.filter(e => e.status === 'running' || e.status === 'finished')
  } catch {
    events.value = []
  } finally {
    loadingEvents.value = false
  }
}

onMounted(() => {
  fetchProfile()
  fetchEvents()
})
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
}

.ctf-header {
  text-shadow: 0 0 15px rgba(24, 255, 255, 0.2);
  letter-spacing: 1px;
}

.glass-panel {
  background: rgba(18, 24, 38, 0.6) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(24, 255, 255, 0.15) !important;
  transition: all 0.3s ease;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 230, 118, 0.15), 0 0 0 1px rgba(0, 230, 118, 0.4) !important;
}

.admin-action-card {
  border: 1px solid rgba(255, 23, 68, 0.25) !important;
}

.admin-action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 23, 68, 0.15), 0 0 0 1px rgba(255, 23, 68, 0.4) !important;
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 230, 118, 0.12) !important;
}

.description-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
