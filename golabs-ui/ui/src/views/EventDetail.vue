<template>
  <v-container class="py-10 event-detail-page">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-16">
      <v-progress-circular indeterminate color="primary" size="64" width="5"></v-progress-circular>
      <p class="mt-4 text-grey">Loading event data...</p>
    </div>

    <!-- Error -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-6">{{ error }}</v-alert>

    <!-- Event Content -->
    <template v-else-if="event">
      <!-- Header -->
      <div class="d-flex flex-column flex-md-row justify-space-between align-start align-md-center mb-8">
        <div>
          <v-btn variant="text" color="grey" to="/events" prepend-icon="mdi-arrow-left" class="mb-2 px-0">Back to Events</v-btn>
          <h1 class="text-h3 font-weight-black text-white ctf-header">{{ event.name || event.title }}</h1>
          <div class="d-flex align-center gap-3 mt-2">
            <v-chip :color="getStatusColor(event.status)" size="small" class="font-weight-bold text-uppercase" variant="flat">
              {{ event.status }}
            </v-chip>
            <span class="text-caption text-grey">Max {{ event.max_team_size }} per team</span>
          </div>
        </div>
        <div class="d-flex gap-2 mt-4 mt-md-0">
          <v-btn color="secondary" variant="outlined" :to="`/events/${eventId}/leaderboard`" prepend-icon="mdi-trophy">
            Leaderboard
          </v-btn>
          <v-btn v-if="event.status === 'open' || event.status === 'running'" color="primary" variant="outlined" @click="teamDialog = true" prepend-icon="mdi-account-group">
            Team
          </v-btn>
        </div>
      </div>

      <!-- Event Description -->
      <v-card class="glass-panel pa-6 mb-8" rounded="xl" v-if="event.description">
        <p class="text-body-1 text-grey-lighten-1">{{ event.description }}</p>
        <div class="d-flex gap-6 mt-4">
          <div class="text-caption text-grey">
            <v-icon size="small" class="mr-1 text-primary">mdi-clock-start</v-icon>
            {{ new Date(event.starts_at).toLocaleString() }}
          </div>
          <div class="text-caption text-grey">
            <v-icon size="small" class="mr-1 text-error">mdi-clock-end</v-icon>
            {{ new Date(event.ends_at).toLocaleString() }}
          </div>
        </div>
      </v-card>

      <!-- Challenges Section (visible if running, admin, or team member) -->
      <template v-if="isAdmin || event.status === 'running' || isTeamMember">
        <div class="d-flex justify-space-between align-center mb-4">
          <h2 class="text-h5 font-weight-bold text-white" style="letter-spacing: 1px;">Challenges</h2>
          <div class="text-caption text-grey">{{ challenges.length }} total</div>
        </div>

      <!-- Category Filter -->
      <div class="d-flex gap-2 mb-6 flex-wrap" v-if="categories.length > 0">
        <v-chip 
          v-for="cat in categories" :key="cat"
          :color="activeCat === cat ? 'primary' : 'grey'" 
          :variant="activeCat === cat ? 'flat' : 'outlined'"
          class="font-weight-bold text-uppercase"
          size="small"
          @click="activeCat = activeCat === cat ? '' : cat"
        >
          {{ cat }}
        </v-chip>
      </div>

      <v-row v-if="filteredChallenges.length === 0">
        <v-col cols="12">
          <v-card class="glass-panel pa-10 text-center" rounded="xl" style="border-style: dashed !important;">
            <v-icon size="48" color="grey" class="mb-3">mdi-puzzle-outline</v-icon>
            <p class="text-grey">No challenges available yet.</p>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col v-for="ch in filteredChallenges" :key="ch.id" cols="12" sm="6" lg="4">
          <v-card 
            class="glass-panel challenge-card" 
            rounded="xl" 
            :class="{ 'solved-card': solvedIds.has(ch.id) }"
            @click="openChallenge(ch)"
            hover
          >
            <v-card-title class="d-flex justify-space-between align-center px-5 pt-5 pb-1">
              <span class="text-body-1 font-weight-bold text-truncate" style="max-width: 70%;">{{ ch.title }}</span>
              <span class="text-primary font-weight-black">{{ ch.points }} pts</span>
            </v-card-title>
            <v-card-text class="px-5 pb-5">
              <div class="d-flex gap-2 mb-3">
                <v-chip :color="getDiffColor(ch.difficulty)" size="x-small" variant="flat" class="font-weight-bold text-uppercase">{{ ch.difficulty }}</v-chip>
                <v-chip color="grey" size="x-small" variant="outlined" class="text-uppercase">{{ ch.category }}</v-chip>
              </div>
              <p class="text-body-2 text-grey-lighten-1 description-text">{{ ch.description }}</p>
              <div class="d-flex justify-space-between align-center mt-3 text-caption text-grey">
                <span><v-icon size="small" class="mr-1">mdi-check-decagram</v-icon>{{ ch.solve_count }} solves</span>
                <v-icon v-if="solvedIds.has(ch.id)" color="success" size="small">mdi-check-circle</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        </v-row>
      </template>
      <v-card v-else class="glass-panel pa-8 text-center" rounded="xl" style="border-style: dashed !important;">
        <v-icon size="48" color="warning" class="mb-3">mdi-lock-clock</v-icon>
        <h3 class="text-h6 font-weight-bold text-white">Classified Area</h3>
        <p class="text-grey mb-0">Join a team to access challenge details, or wait until the event starts.</p>
      </v-card>
    </template>

    <!-- Challenge Detail Dialog -->
    <v-dialog v-model="challengeDialog" max-width="600">
      <v-card class="glass-panel" border="primary" rounded="xl" v-if="selectedChallenge">
        <v-card-title class="d-flex justify-space-between align-center px-6 pt-6">
          <span class="text-h6 font-weight-bold">{{ selectedChallenge.title }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="challengeDialog = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="px-6">
          <div class="d-flex gap-2 mb-4">
            <v-chip :color="getDiffColor(selectedChallenge.difficulty)" size="small" variant="flat" class="font-weight-bold text-uppercase">{{ selectedChallenge.difficulty }}</v-chip>
            <v-chip color="grey" size="small" variant="outlined" class="text-uppercase">{{ selectedChallenge.category }}</v-chip>
            <v-chip color="primary" size="small" variant="outlined">{{ selectedChallenge.points }} pts</v-chip>
          </div>

          <p class="text-body-1 text-grey-lighten-1 mb-6" style="white-space: pre-wrap;">{{ selectedChallenge.description }}</p>

          <v-text-field
            v-if="selectedChallenge.file_url"
            :model-value="selectedChallenge.file_url"
            label="File URL"
            variant="outlined"
            readonly
            append-inner-icon="mdi-open-in-new"
            @click:append-inner="window.open(selectedChallenge.file_url, '_blank')"
            class="mb-4"
          ></v-text-field>

          <v-divider class="mb-4 border-opacity-25"></v-divider>

          <!-- Solved Badge -->
          <v-alert
            v-if="solvedIds.has(selectedChallenge.id)"
            type="success"
            variant="tonal"
            class="mb-0"
            icon="mdi-check-decagram"
          >
            <span class="font-weight-bold">Challenge Completed!</span>
            <span class="text-caption ml-2">Your team has already captured this flag.</span>
          </v-alert>

          <!-- Read-only notice when event is not running -->
          <v-alert
            v-else-if="event.status !== 'running'"
            type="info"
            variant="tonal"
            class="mb-0"
            icon="mdi-eye-outline"
          >
            <span class="font-weight-bold">Read Only</span>
            <span class="text-caption ml-2">Flag submission is disabled because the event is not currently running.</span>
          </v-alert>

          <!-- Flag Submission (only when NOT solved AND event is running) -->
          <template v-else-if="event.status === 'running'">
            <div class="d-flex align-center gap-2">
              <v-text-field
                v-model="flagInput"
                label="Submit Flag"
                placeholder="golabs{...}"
                variant="outlined"
                color="primary"
                prepend-inner-icon="mdi-flag-variant"
                hide-details
                density="comfortable"
                @keyup.enter="submitFlag"
              ></v-text-field>
              <v-btn 
                color="primary" 
                variant="elevated" 
                @click="submitFlag" 
                :loading="submitLoading"
                :disabled="!flagInput.trim()"
                class="font-weight-bold"
              >
                Submit
              </v-btn>
            </div>
          </template>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Team Dialog -->
    <v-dialog v-model="teamDialog" max-width="500">
      <v-card class="glass-panel" border="primary" rounded="xl">
        <v-card-title class="d-flex justify-space-between align-center px-6 pt-6">
          Team Management
          <v-btn icon="mdi-close" variant="text" size="small" @click="teamDialog = false"></v-btn>
        </v-card-title>

        <v-tabs v-model="teamTab" color="primary" grow>
          <v-tab value="members">Members</v-tab>
          <v-tab value="join">Join</v-tab>
          <v-tab value="create">Create</v-tab>
        </v-tabs>

        <v-card-text class="pt-6">
          <v-alert v-if="teamMsg" :type="teamMsgType" variant="tonal" class="mb-4">{{ teamMsg }}</v-alert>
          
          <v-window v-model="teamTab">
            <!-- Members -->
            <v-window-item value="members">
              <p v-if="teamMembers.length === 0" class="text-grey text-center py-4">You are not in a team for this event yet.</p>
              <v-list v-else bg-color="transparent" density="compact">
                <v-list-item v-for="m in teamMembers" :key="m.user_id">
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-account</v-icon>
                  </template>
                  <v-list-item-title>{{ m.username }}</v-list-item-title>
                  <v-list-item-subtitle>{{ m.role }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-window-item>

            <!-- Join -->
            <v-window-item value="join">
              <v-text-field v-model="joinTeamName" label="Team Name" variant="outlined" color="primary" class="mb-3"></v-text-field>
              <v-text-field v-model="joinSecret" label="Join Secret" variant="outlined" color="primary" @keyup.enter="joinTeam"></v-text-field>
              <v-btn color="primary" block @click="joinTeam" :loading="teamLoading" class="mt-2 font-weight-bold">Join</v-btn>
            </v-window-item>

            <!-- Create -->
            <v-window-item value="create">
              <v-text-field v-model="newTeamName" label="Team Name" variant="outlined" color="primary" @keyup.enter="createTeam"></v-text-field>
              <v-btn color="primary" block @click="createTeam" :loading="teamLoading" class="mt-2 font-weight-bold">Create</v-btn>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api'
import { useNotify } from '@/composables/useNotify'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const notify = useNotify()
const { isAdmin, userId } = useAuth()
const eventId = route.params.id

const event = ref(null)
const challenges = ref([])
const loading = ref(true)
const error = ref('')
const activeCat = ref('')
const isTeamMember = ref(false)

// Challenge solving
const challengeDialog = ref(false)
const selectedChallenge = ref(null)
const flagInput = ref('')
const submitLoading = ref(false)
const solvedIds = ref(new Set())

// Team management
const teamDialog = ref(false)
const teamTab = ref('members')
const teamMembers = ref([])
const teamMsg = ref('')
const teamMsgType = ref('info')
const teamLoading = ref(false)
const joinTeamName = ref('')
const joinSecret = ref('')
const newTeamName = ref('')

const categories = computed(() => [...new Set(challenges.value.map(c => c.category))])
const filteredChallenges = computed(() => {
  if (!activeCat.value) return challenges.value
  return challenges.value.filter(c => c.category === activeCat.value)
})

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'open': return 'primary'
    case 'running': return 'success'
    case 'finished': return 'grey'
    default: return 'warning'
  }
}

const getDiffColor = (diff) => {
  switch (diff?.toLowerCase()) {
    case 'easy': return 'success'
    case 'medium': return 'warning'
    case 'hard': return 'error'
    default: return 'grey'
  }
}

const fetchEvent = async () => {
  try {
    const res = await api.get(`/events/${eventId}`)
    event.value = res.data
  } catch {
    error.value = 'Failed to load event.'
  }
}

const fetchChallenges = async () => {
  try {
    const res = await api.get(`/events/${eventId}/challenges`)
    challenges.value = res.data.data || res.data || []
  } catch {
    challenges.value = []
  }
}

const openChallenge = (ch) => {
  selectedChallenge.value = ch
  flagInput.value = ''
  challengeDialog.value = true
}

const submitFlag = async () => {
  if (!flagInput.value.trim() || !selectedChallenge.value) return
  submitLoading.value = true
  try {
    const res = await api.post(`/events/${eventId}/challenges/${selectedChallenge.value.id}/submit`, {
      flag: flagInput.value.trim()
    })
    if (res.data.correct) {
      solvedIds.value.add(selectedChallenge.value.id)
      if (res.data.points > 0) {
        notify.success(`Correct! +${res.data.points} points`)
      } else {
        notify.info('Challenge was already solved by your team.')
      }
      await fetchChallenges()
    } else {
      notify.error('Incorrect flag. Try again.')
    }
  } catch (err) {
    const errMsg = err.response?.data?.error || ''
    // If backend says already solved, mark it
    if (errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('solved')) {
      solvedIds.value.add(selectedChallenge.value.id)
      notify.info('This challenge has already been solved by your team.')
    } else {
      notify.error(errMsg || 'Failed to submit flag.')
    }
  } finally {
    submitLoading.value = false
    flagInput.value = ''
  }
}

const joinTeam = async () => {
  if (!joinTeamName.value.trim() || !joinSecret.value.trim()) {
    teamMsg.value = 'Both team name and join secret are required.'
    teamMsgType.value = 'error'
    return
  }
  teamLoading.value = true
  try {
    await api.post(`/events/${eventId}/teams/join`, {
      team_name: joinTeamName.value.trim(),
      join_secret: joinSecret.value.trim()
    })
    teamMsg.value = 'Successfully joined team!'
    teamMsgType.value = 'success'
    joinTeamName.value = ''
    joinSecret.value = ''
  } catch (err) {
    teamMsg.value = err.response?.data?.error || 'Failed to join team.'
    teamMsgType.value = 'error'
  } finally {
    teamLoading.value = false
  }
}

const createTeam = async () => {
  if (!newTeamName.value.trim()) {
    teamMsg.value = 'Team name is required.'
    teamMsgType.value = 'error'
    return
  }
  teamLoading.value = true
  try {
    const res = await api.post(`/events/${eventId}/teams`, { name: newTeamName.value.trim() })
    teamMsg.value = `Team created! Save your Join Secret: ${res.data.join_secret}`
    teamMsgType.value = 'success'
    newTeamName.value = ''
  } catch (err) {
    teamMsg.value = err.response?.data?.error || 'Failed to create team.'
    teamMsgType.value = 'error'
  } finally {
    teamLoading.value = false
  }
}

const checkTeamMembership = async () => {
  try {
    const teamsRes = await api.get(`/events/${eventId}/teams`)
    const teams = teamsRes.data.data || teamsRes.data || []
    for (const team of teams) {
      try {
        const membersRes = await api.get(`/events/${eventId}/teams/${team.id}/members`)
        const members = membersRes.data.data || membersRes.data || []
        if (members.some(m => m.user_id === userId.value)) {
          isTeamMember.value = true
          return
        }
      } catch {
        // skip team if members can't be fetched
      }
    }
  } catch {
    // Not critical — user just won't see challenges
  }
}

onMounted(async () => {
  await Promise.all([fetchEvent(), fetchChallenges(), checkTeamMembership()])
  loading.value = false
})
</script>

<style scoped>
.event-detail-page { min-height: 100vh; }

.ctf-header {
  text-shadow: 0 0 12px rgba(24, 255, 255, 0.2);
  letter-spacing: 1px;
}

.glass-panel {
  background: rgba(10, 16, 26, 0.6) !important;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 230, 118, 0.1) !important;
}

.challenge-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.challenge-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 230, 118, 0.12) !important;
}

.solved-card {
  border: 1px solid rgba(76, 175, 80, 0.4) !important;
}

.description-text {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.8rem;
}
</style>
