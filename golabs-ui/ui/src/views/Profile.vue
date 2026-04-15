<template>
  <v-container class="py-10 profile-page" style="max-width: 1000px;">
    
    <v-row v-if="loading">
      <v-col class="text-center py-16">
        <v-progress-circular indeterminate color="primary" size="64" width="5"></v-progress-circular>
        <div class="mt-4 text-primary font-weight-bold" style="letter-spacing: 2px;">DECRYPTING IDENTITY...</div>
      </v-col>
    </v-row>

    <template v-else-if="profile">
      <!-- High-End Profile Header -->
      <v-card class="glass-panel profile-hero mb-8" rounded="xl" elevation="10" border="primary">
        <div class="hero-bg"></div>
        <v-card-text class="d-flex flex-column flex-md-row align-center align-md-start pa-8 position-relative z-index-1">
          
          <!-- Avatar Section -->
          <div class="avatar-container mr-md-10 mb-6 mb-md-0 position-relative">
            <div class="avatar-ring pulse-ring"></div>
            <div class="avatar-ring hex-ring"></div>
            <v-avatar size="150" color="black" class="hologram-avatar elevation-10">
              <img :src="`https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}&baseColor=18FFFF`" alt="Avatar" />
            </v-avatar>
          </div>

          <!-- Identity Section -->
          <div class="identity-section flex-grow-1 text-center text-md-left">
            <div class="d-flex align-center justify-center justify-md-start mb-2">
              <h1 class="text-h3 font-weight-black text-white text-uppercase" style="letter-spacing: 2px; text-shadow: 0 0 15px rgba(24,255,255,0.4);">
                {{ profile.username }}
              </h1>
              <v-icon v-if="profile.role === 'admin'" color="error" class="ml-3" size="32" title="System Administrator">mdi-shield-crown</v-icon>
              <v-icon v-else color="primary" class="ml-3" size="32" title="Operative">mdi-check-decagram</v-icon>
            </div>

            <!-- Level Progress -->
            <div class="level-system mb-4">
              <div class="d-flex justify-space-between align-end mb-1">
                <span class="text-caption font-weight-bold text-grey-lighten-1">LEVEL {{ currentLevel }}</span>
                <span class="text-caption text-primary">{{ pointsProgress }} / 100 XP</span>
              </div>
              <v-progress-linear
                :model-value="pointsProgress"
                color="primary"
                height="8"
                rounded
                striped
                class="level-bar"
              ></v-progress-linear>
            </div>

            <div class="d-flex flex-wrap gap-3 justify-center justify-md-start mt-4">
              <v-chip :color="profile.role === 'admin' ? 'error' : 'primary'" size="small" variant="outlined" class="font-weight-bold text-uppercase">
                <v-icon start size="small">mdi-badge-account</v-icon>{{ profile.role }}
              </v-chip>
              <v-chip color="secondary" size="small" variant="flat" class="font-weight-black text-black">
                <v-icon start size="small">mdi-star-circle</v-icon>{{ profile.points ?? 0 }} PTS
              </v-chip>
              <v-chip v-if="profile.banned" color="error" size="small" variant="elevated" class="font-weight-bold">
                <v-icon start size="small">mdi-gavel</v-icon>BANNED
              </v-chip>
              <v-chip v-if="profile.email && isOwner" color="grey" size="small" variant="outlined">
                <v-icon start size="small">mdi-email</v-icon>{{ profile.email }}
              </v-chip>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Stats Grid -->
      <v-row class="mb-4">
        <v-col cols="12" md="6">
          <v-card class="glass-panel stat-card h-100 pa-6" rounded="xl">
            <div class="d-flex align-top justify-space-between">
              <div>
                <div class="text-caption text-primary text-uppercase font-weight-bold mb-1" style="letter-spacing: 2px;">Total Score</div>
                <div class="text-h3 font-weight-black text-white glow-text">{{ profile.points ?? 0 }}</div>
              </div>
              <v-icon size="48" color="primary" class="opacity-50">mdi-lightning-bolt</v-icon>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="glass-panel stat-card h-100 pa-6" rounded="xl">
            <div class="d-flex align-top justify-space-between">
              <div>
                <div class="text-caption text-secondary text-uppercase font-weight-bold mb-1" style="letter-spacing: 2px;">Identity Created</div>
                <div class="text-h5 font-weight-bold text-white mt-2">
                  {{ profile.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown Origin' }}
                </div>
              </div>
              <v-icon size="48" color="secondary" class="opacity-50">mdi-calendar-clock</v-icon>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Private Section: Edit Profile & Password -->
      <v-slide-y-transition>
        <div v-if="isOwner" class="mt-8">
          <div class="d-flex align-center mb-6">
            <v-icon color="grey-lighten-1" class="mr-3">mdi-lock</v-icon>
            <h2 class="text-h5 font-weight-black text-grey-lighten-1 text-uppercase" style="letter-spacing: 2px;">Private Settings</h2>
            <v-divider class="ml-4 border-opacity-25"></v-divider>
          </div>

          <v-row>
            <v-col cols="12" md="6">
              <v-card class="glass-panel pa-8 h-100" rounded="xl">
                <h3 class="text-h6 font-weight-bold text-white mb-6">
                  <v-icon class="mr-2" color="primary">mdi-pencil</v-icon>Update Intel
                </h3>

                <v-alert v-if="editError" type="error" variant="tonal" class="mb-4">{{ editError }}</v-alert>

                <v-text-field 
                  v-model="editForm.username" 
                  label="Operative Name (Username)" 
                  variant="outlined" 
                  color="primary"
                  class="mb-4"
                  :rules="[v => !v || v.length >= 3 || 'Min 3 characters']"
                ></v-text-field>
                <v-text-field 
                  v-model="editForm.email" 
                  label="Secure Comm Link (Email)" 
                  variant="outlined" 
                  color="primary"
                  class="mb-4"
                  :rules="[v => !v || /.+@.+\..+/.test(v) || 'Invalid email format']"
                ></v-text-field>

                <v-btn color="primary" variant="elevated" @click="updateProfile" :loading="editLoading" class="font-weight-bold" block>
                  Save Identity
                </v-btn>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card class="glass-panel pa-8 h-100" rounded="xl">
                <h3 class="text-h6 font-weight-bold text-white mb-6">
                  <v-icon class="mr-2" color="warning">mdi-shield-key</v-icon>Change Passphrase
                </h3>

                <v-alert v-if="passError" type="error" variant="tonal" class="mb-4">{{ passError }}</v-alert>

                <v-text-field 
                  v-model="passForm.current_password" 
                  label="Current Passphrase" 
                  type="password"
                  variant="outlined" 
                  color="warning"
                  class="mb-4"
                ></v-text-field>
                <v-text-field 
                  v-model="passForm.new_password" 
                  label="New Passphrase" 
                  type="password"
                  variant="outlined" 
                  color="warning"
                  class="mb-4"
                  :rules="[v => v.length >= 6 || 'Min 6 characters']"
                ></v-text-field>

                <v-btn color="warning" variant="elevated" @click="changePassword" :loading="passLoading" class="font-weight-bold" block>
                  Update Passphrase
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-slide-y-transition>
      
    </template>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useNotify } from '@/composables/useNotify'
import { api } from '@/api'
import { useRoute } from 'vue-router'

const { userId } = useAuth()
const notify = useNotify()
const route = useRoute()

// Target user resolution
const targetUserId = computed(() => route.query.id || userId.value)
const isOwner = computed(() => targetUserId.value === userId.value)

const profile = ref(null)
const loading = ref(true)

// Forms
const editForm = ref({ username: '', email: '' })
const editError = ref('')
const editLoading = ref(false)

const passForm = ref({ current_password: '', new_password: '' })
const passError = ref('')
const passLoading = ref(false)

// Computed Rank/Level
const currentLevel = computed(() => {
  const pts = profile.value?.points || 0
  return Math.floor(pts / 100) + 1
})

const pointsProgress = computed(() => {
  const pts = profile.value?.points || 0
  return pts % 100
})

const hackerTitle = computed(() => {
  const pts = profile.value?.points || 0
  if (pts === 0) return 'Unverified Novice'
  if (pts <= 200) return 'Script Kiddie'
  if (pts <= 500) return 'Cyber Mercenary'
  if (pts <= 1000) return 'Netrunner'
  if (pts <= 2000) return 'Elite Operative'
  if (pts <= 5000) return '0day Architect'
  return 'Apex Legend'
})

const fetchProfile = async () => {
  try {
    loading.value = true
    profile.value = null
    const res = await api.get(`/users/${targetUserId.value}`)
    profile.value = res.data
    editForm.value.username = res.data.username || ''
    editForm.value.email = res.data.email || ''
  } catch {
    notify.error('Failed to decrypt public identity profile.')
  } finally {
    loading.value = false
  }
}

const updateProfile = async () => {
  editError.value = ''
  editLoading.value = true
  try {
    const payload = {}
    if (editForm.value.username && editForm.value.username !== profile.value.username) {
      payload.username = editForm.value.username
    }
    if (editForm.value.email && editForm.value.email !== profile.value.email) {
      payload.email = editForm.value.email
    }
    if (Object.keys(payload).length === 0) {
      notify.info('No changes detected in subsystem.')
      editLoading.value = false
      return
    }
    await api.post(`/users/${userId.value}/update`, payload)
    notify.success('Identity databanks updated successfully!')
    await fetchProfile()
  } catch (err) {
    editError.value = err.response?.data?.error || 'Failed to update identity.'
  } finally {
    editLoading.value = false
  }
}

const changePassword = async () => {
  passError.value = ''
  if (!passForm.value.current_password || !passForm.value.new_password) {
    passError.value = 'Passphrase fields cannot be empty.'
    return
  }
  if (passForm.value.new_password.length < 6) {
    passError.value = 'Passphrase complexity insufficient (min 6 chars).'
    return
  }
  passLoading.value = true
  try {
    await api.post(`/users/${userId.value}/password`, {
      current_password: passForm.value.current_password,
      new_password: passForm.value.new_password
    })
    notify.success('Encryption keys updated successfully!')
    passForm.value = { current_password: '', new_password: '' }
  } catch (err) {
    passError.value = err.response?.data?.error || 'Authentication rejected.'
  } finally {
    passLoading.value = false
  }
}

// React whenever the URL id param changes (e.g. searching another user)
watch(() => route.query.id, () => {
  fetchProfile()
})

onMounted(fetchProfile)
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
}

.glass-panel {
  background: rgba(10, 16, 26, 0.7) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(24, 255, 255, 0.2) !important;
  transition: transform 0.3s ease, border-color 0.3s ease;
}

/* Hero Section */
.profile-hero {
  position: relative;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at right bottom, rgba(24, 255, 255, 0.1) 0%, transparent 60%);
  pointer-events: none;
}

.z-index-1 {
  z-index: 1;
}

/* Hologram Avatar */
.avatar-container {
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hologram-avatar {
  border: 2px solid #18FFFF;
  box-shadow: 0 0 20px rgba(24, 255, 255, 0.4), inset 0 0 20px rgba(24, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.5) !important;
}

.avatar-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  pointer-events: none;
}

.pulse-ring {
  width: 170px;
  height: 170px;
  border: 1px dashed rgba(24, 255, 255, 0.5);
  animation: spin 10s linear infinite;
}

.hex-ring {
  width: 190px;
  height: 190px;
  border: 2px solid transparent;
  border-top-color: rgba(24, 255, 255, 0.3);
  border-bottom-color: rgba(24, 255, 255, 0.1);
  animation: spin 15s linear infinite reverse;
}

@keyframes spin {
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

/* Typography & Visuals */
.glow-text {
  text-shadow: 0 0 15px rgba(24, 255, 255, 0.5);
}

.level-bar {
  box-shadow: 0 0 10px rgba(24, 255, 255, 0.3);
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: rgba(24, 255, 255, 0.5) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.opacity-50 {
  opacity: 0.5;
}

.gap-3 {
  gap: 12px;
}
</style>
