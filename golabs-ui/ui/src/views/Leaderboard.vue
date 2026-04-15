<template>
  <v-container class="py-10 leaderboard-page">
    <v-btn variant="text" color="grey" :to="`/events/${eventId}`" prepend-icon="mdi-arrow-left" class="mb-4 px-0">Back to Event</v-btn>
    
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h3 font-weight-black text-white ctf-header">
          <v-icon size="36" color="warning" class="mr-2">mdi-trophy</v-icon>Leaderboard
        </h1>
        <p class="text-grey-lighten-1 mt-1" v-if="eventName">{{ eventName }}</p>
      </div>
      <v-btn color="primary" variant="outlined" @click="fetchLeaderboard" :loading="loading" prepend-icon="mdi-refresh" size="small">Refresh</v-btn>
    </div>

    <v-card class="glass-panel" rounded="xl">
      <v-table theme="dark" class="bg-transparent">
        <thead>
          <tr>
            <th class="text-center font-weight-black" style="width: 60px;">#</th>
            <th class="text-left font-weight-black">Team</th>
            <th class="text-right font-weight-black">Score</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(team, i) in teams" :key="team.id" :class="getRankClass(i)">
            <td class="text-center font-weight-black" style="font-size: 1.1rem;">
              <v-icon v-if="i === 0" color="warning" size="24">mdi-medal</v-icon>
              <v-icon v-else-if="i === 1" color="grey-lighten-1" size="24">mdi-medal</v-icon>
              <v-icon v-else-if="i === 2" color="deep-orange" size="24">mdi-medal</v-icon>
              <span v-else class="text-grey">{{ i + 1 }}</span>
            </td>
            <td>
              <span class="font-weight-bold" :class="i < 3 ? 'text-white' : 'text-grey-lighten-1'">{{ team.name }}</span>
              <span v-if="team.member_count" class="text-caption text-grey ml-2">({{ team.member_count }})</span>
            </td>
            <td class="text-right">
              <span class="font-weight-black text-primary" style="font-size: 1.1rem;">{{ team.score }}</span>
            </td>
          </tr>
          <tr v-if="teams.length === 0 && !loading">
            <td colspan="3" class="text-center py-10 text-grey">
              <v-icon size="48" class="mb-2">mdi-account-group-outline</v-icon>
              <div>No teams have registered yet.</div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api'

const route = useRoute()
const eventId = route.params.id

const teams = ref([])
const eventName = ref('')
const loading = ref(true)
let refreshTimer = null

const getRankClass = (i) => {
  if (i === 0) return 'rank-gold'
  if (i === 1) return 'rank-silver'
  if (i === 2) return 'rank-bronze'
  return ''
}

const fetchLeaderboard = async () => {
  try {
    loading.value = true
    const res = await api.get(`/events/${eventId}/teams`)
    teams.value = res.data.data || res.data || []
    
    // In case the API doesn't sort by score descending natively:
    teams.value.sort((a, b) => (b.score || 0) - (a.score || 0))
  } catch {
    teams.value = []
  } finally {
    loading.value = false
  }
}

const fetchEvent = async () => {
  try {
    const res = await api.get(`/events/${eventId}`)
    const ev = res.data
    eventName.value = ev.name || ev.title || ''
    // Auto-refresh during running events
    if (ev.status === 'running') {
      refreshTimer = setInterval(fetchLeaderboard, 30000)
    }
  } catch {
    // Non-critical
  }
}

onMounted(async () => {
  await Promise.all([fetchEvent(), fetchLeaderboard()])
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.leaderboard-page { min-height: 100vh; }

.ctf-header {
  text-shadow: 0 0 12px rgba(24, 255, 255, 0.2);
  letter-spacing: 1px;
}

.glass-panel {
  background: rgba(10, 16, 26, 0.6) !important;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(24, 255, 255, 0.15) !important;
}

.rank-gold {
  background: linear-gradient(90deg, rgba(255, 193, 7, 0.08) 0%, transparent 100%) !important;
  border-left: 3px solid #ffc107;
}

.rank-silver {
  background: linear-gradient(90deg, rgba(189, 189, 189, 0.06) 0%, transparent 100%) !important;
  border-left: 3px solid #bdbdbd;
}

.rank-bronze {
  background: linear-gradient(90deg, rgba(255, 87, 34, 0.06) 0%, transparent 100%) !important;
  border-left: 3px solid #ff5722;
}
</style>
