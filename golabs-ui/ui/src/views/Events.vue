<template>
  <v-container class="py-10 events-page">
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h3 font-weight-black text-white ctf-header">War Games</h1>
        <p class="text-grey-lighten-1 mt-1">Browse CTF events, form teams, and compete.</p>
      </div>
      <v-btn color="primary" variant="outlined" @click="fetchEvents" :loading="loading" prepend-icon="mdi-refresh">Refresh</v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-8">{{ error }}</v-alert>

    <!-- Status Filter Chips -->
    <div class="d-flex gap-2 mb-6 flex-wrap">
      <v-chip 
        v-for="s in statusFilters" :key="s.value"
        :color="activeFilter === s.value ? s.color : 'grey'" 
        :variant="activeFilter === s.value ? 'flat' : 'outlined'"
        class="font-weight-bold"
        @click="activeFilter = activeFilter === s.value ? '' : s.value"
      >
        {{ s.label }}
      </v-chip>
    </div>

    <v-row v-if="loading">
      <v-col cols="12" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" width="5"></v-progress-circular>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12" md="6" lg="4" v-for="event in filteredEvents" :key="event.id">
        <v-card class="glass-panel event-card" rounded="xl" :border="getStatusColor(event.status)" elevation="0">
          <div class="d-flex justify-space-between align-center px-5 pt-5">
            <v-chip size="small" :color="getStatusColor(event.status)" class="font-weight-bold text-uppercase" variant="flat">
              {{ event.status }}
            </v-chip>
            <div class="text-caption text-grey">{{ event.max_team_size }} per team</div>
          </div>
          
          <v-card-title class="text-h6 font-weight-black mt-1 text-wrap line-clamp-2 px-5">
            {{ event.name || event.title }}
          </v-card-title>
          
          <v-card-text class="px-5">
            <p class="mb-4 description-text text-grey-lighten-1">{{ event.description || 'No description available.' }}</p>
            <div class="d-flex align-center text-caption mb-1">
              <v-icon size="small" class="mr-2 text-primary">mdi-clock-start</v-icon>
              {{ new Date(event.starts_at).toLocaleString() }}
            </div>
            <div class="d-flex align-center text-caption">
              <v-icon size="small" class="mr-2 text-error">mdi-clock-end</v-icon>
              {{ new Date(event.ends_at).toLocaleString() }}
            </div>
          </v-card-text>
          
          <v-divider class="border-opacity-15 mx-4"></v-divider>
          
          <v-card-actions class="px-4 py-3 d-flex justify-end gap-2">
            <v-btn 
              v-if="event.status === 'open' || event.status === 'running'" 
              color="primary" variant="outlined" size="small"
              @click="openTeamDialog(event)"
            >
              Team Uplink
            </v-btn>
            <v-btn 
              color="secondary" variant="outlined" size="small"
              :disabled="event.status === 'draft'"
              :to="`/events/${event.id}/leaderboard`"
            >
              Leaderboard
            </v-btn>
            <v-btn 
              color="primary" variant="elevated" size="small" class="font-weight-bold"
              :to="`/events/${event.id}`"
            >
              Details
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    
    <div v-if="!loading && filteredEvents.length === 0" class="text-center py-12 glass-panel rounded-xl mt-4">
      <v-icon size="64" color="grey" class="mb-4">mdi-radar</v-icon>
      <h3 class="text-h6 text-grey">No events match the current filter.</h3>
    </div>

    <!-- Team Interaction Dialog -->
    <v-dialog v-model="teamDialog" max-width="500">
      <v-card class="glass-panel" border="primary" rounded="xl">
        <v-card-title class="text-primary font-weight-black border-b d-flex justify-space-between align-center px-6 py-4">
          Establish Team Uplink
          <v-btn icon="mdi-close" variant="text" size="small" @click="teamDialog = false"></v-btn>
        </v-card-title>
        
        <v-tabs v-model="teamTab" color="primary" grow>
          <v-tab value="join">Join Existing</v-tab>
          <v-tab value="create">Create New</v-tab>
        </v-tabs>
        
        <v-card-text class="pt-6">
          <v-alert v-if="teamError" type="error" variant="tonal" class="mb-4">{{ teamError }}</v-alert>
          <v-alert v-if="teamSuccess" type="success" variant="tonal" class="mb-4">{{ teamSuccess }}</v-alert>
          
          <v-window v-model="teamTab">
            <!-- Join Team -->
            <v-window-item value="join">
              <p class="text-caption text-grey mb-4">Provide the team name and the cryptographic JOIN SECRET to establish sync.</p>
              <v-text-field v-model="joinTeamName" label="Team Name" variant="outlined" color="primary" prepend-inner-icon="mdi-shield-account" class="mb-3"></v-text-field>
              <v-text-field v-model="joinSecretStr" label="Join Secret" variant="outlined" color="primary" prepend-inner-icon="mdi-key" @keyup.enter="joinTeam"></v-text-field>
              <v-btn color="primary" block @click="joinTeam" :loading="actionLoading" class="mt-4 font-weight-black" variant="elevated">Initiate Sync</v-btn>
            </v-window-item>
            
            <!-- Create Team -->
            <v-window-item value="create">
              <p class="text-caption text-grey mb-4">Found a vanguard unit. You will be assigned as the Captain.</p>
              <v-text-field v-model="newTeamName" label="Squadron Name" variant="outlined" color="primary" prepend-inner-icon="mdi-shield-account" @keyup.enter="createTeam"></v-text-field>
              <v-btn color="primary" block @click="createTeam" :loading="actionLoading" class="mt-4 font-weight-black" variant="elevated">Found Element</v-btn>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api'
import { useNotify } from '@/composables/useNotify'
import { useAuth } from '@/composables/useAuth'

const notify = useNotify()
const { isAdmin } = useAuth()

const events = ref([])
const loading = ref(false)
const error = ref('')
const activeFilter = ref('')

const statusFilters = [
  { label: 'Open', value: 'open', color: 'primary' },
  { label: 'Running', value: 'running', color: 'success' },
  { label: 'Finished', value: 'finished', color: 'grey' },
  { label: 'Draft', value: 'draft', color: 'warning' },
]

const filteredEvents = computed(() => {
  let displayEvents = events.value
  
  if (!isAdmin.value) {
    displayEvents = displayEvents.filter(e => e.status !== 'draft' && e.status !== 'open')
  }

  if (!activeFilter.value) return displayEvents
  return displayEvents.filter(e => e.status === activeFilter.value)
})

const teamDialog = ref(false)
const teamTab = ref('join')
const teamError = ref('')
const teamSuccess = ref('')
const actionLoading = ref(false)
const activeEvent = ref(null)

const joinSecretStr = ref('')
const joinTeamName = ref('')
const newTeamName = ref('')

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'open': return 'primary'
    case 'running': return 'success'
    case 'finished': return 'grey'
    case 'draft': default: return 'warning'
  }
}

const fetchEvents = async () => {
  try {
    loading.value = true
    error.value = ''
    const res = await api.get('/events')
    events.value = res.data.data || res.data || []
  } catch {
    error.value = 'Failed to fetch events from the server.'
  } finally {
    loading.value = false
  }
}

const openTeamDialog = (event) => {
  activeEvent.value = event
  teamError.value = ''
  teamSuccess.value = ''
  joinSecretStr.value = ''
  joinTeamName.value = ''
  newTeamName.value = ''
  teamDialog.value = true
}

const createTeam = async () => {
  if (!newTeamName.value.trim()) {
    teamError.value = 'Squadron name is required.'
    return
  }
  try {
    actionLoading.value = true
    teamError.value = ''
    teamSuccess.value = ''
    
    const res = await api.post(`/events/${activeEvent.value.id}/teams`, {
      name: newTeamName.value.trim()
    })
    
    const secret = res.data.join_secret
    teamSuccess.value = `Squadron founded! Save this Join Secret: ${secret}`
    notify.success('Team created successfully!')
    newTeamName.value = ''
  } catch (err) {
    teamError.value = err.response?.data?.error || 'Failed to create team.'
  } finally {
    actionLoading.value = false
  }
}

const joinTeam = async () => {
  if (!joinTeamName.value.trim() || !joinSecretStr.value.trim()) {
    teamError.value = 'Both team name and join secret are required.'
    return
  }
  try {
    actionLoading.value = true
    teamError.value = ''
    teamSuccess.value = ''
    
    await api.post(`/events/${activeEvent.value.id}/teams/join`, {
      team_name: joinTeamName.value.trim(),
      join_secret: joinSecretStr.value.trim()
    })
    
    teamSuccess.value = 'Neural sync established! You have joined the squadron.'
    notify.success('Successfully joined team!')
    joinSecretStr.value = ''
    joinTeamName.value = ''
  } catch (err) {
    teamError.value = err.response?.data?.error || 'Failed to join team. Check your credentials.'
  } finally {
    actionLoading.value = false
  }
}

onMounted(fetchEvents)
</script>

<style scoped>
.events-page { min-height: 100vh; }

.ctf-header {
  text-shadow: 0 0 12px rgba(24, 255, 255, 0.2);
  letter-spacing: 1px;
}

.glass-panel {
  background: rgba(10, 16, 26, 0.6) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 230, 118, 0.1) !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 12px rgba(0, 230, 118, 0.15) !important;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.description-text {
  font-size: 0.875rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
