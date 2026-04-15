<template>
  <v-container class="py-10 admin-page">
    <h1 class="text-h3 font-weight-black text-error mb-2 admin-header">
      <v-icon size="36" color="error" class="mr-2">mdi-shield-crown</v-icon>Overseer Node
    </h1>
    <p class="text-grey-lighten-1 mb-8">Manage operatives, war games, and challenge matrices.</p>

    <v-tabs v-model="tab" color="error" align-tabs="center" class="mb-8 font-weight-bold">
      <v-tab value="users"><v-icon start>mdi-account-group</v-icon> Operatives</v-tab>
      <v-tab value="events"><v-icon start>mdi-calendar-alert</v-icon> War Games</v-tab>
      <v-tab value="challenges"><v-icon start>mdi-skull-crossbones</v-icon> Challenges</v-tab>
    </v-tabs>

    <v-card class="glass-panel" rounded="xl" border="error">
      <v-window v-model="tab">
        
        <!-- USERS TAB -->
        <v-window-item value="users">
          <v-card-text>
            <div class="d-flex justify-space-between align-center mb-6">
              <h2 class="text-h5 text-error font-weight-black hacker-text">Network Operatives</h2>
              <v-btn color="secondary" @click="fetchUsers" :loading="loading" prepend-icon="mdi-refresh" size="small">Refresh</v-btn>
            </div>
            
            <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

            <v-table theme="dark" class="bg-transparent table-custom">
              <thead>
                <tr>
                  <th class="text-left text-error">Username</th>
                  <th class="text-left text-error">Role</th>
                  <th class="text-left text-error">Points</th>
                  <th class="text-left text-error">Status</th>
                  <th class="text-center text-error">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td class="font-weight-bold text-primary">{{ user.username }}</td>
                  <td>
                    <v-chip :color="user.role === 'admin' ? 'error' : 'secondary'" size="small" variant="flat">
                      {{ user.role }}
                    </v-chip>
                  </td>
                  <td>{{ user.points || 0 }}</td>
                  <td>
                    <v-chip :color="user.banned ? 'error' : 'success'" size="small" variant="outlined">
                      {{ user.banned ? 'BANNED' : 'ACTIVE' }}
                    </v-chip>
                  </td>
                  <td class="text-center d-flex justify-center flex-wrap gap-1 align-center">
                    <v-btn size="small" color="primary" variant="outlined" @click="openEditUserDialog(user)">EDIT</v-btn>
                    <v-btn 
                      size="small" 
                      :color="user.banned ? 'success' : 'error'" 
                      variant="elevated" 
                      @click="confirmToggleBan(user)"
                    >
                      {{ user.banned ? 'UNBAN' : 'BAN' }}
                    </v-btn>
                  </td>
                </tr>
                <tr v-if="users.length === 0">
                  <td colspan="5" class="text-center py-8 text-grey">No operatives found.</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-window-item>

        <!-- EVENTS TAB -->
        <v-window-item value="events">
          <v-card-text>
            <div class="d-flex justify-space-between align-center mb-6">
              <h2 class="text-h5 text-error font-weight-black hacker-text">War Games</h2>
              <v-btn color="error" @click="openCreateEventDialog" prepend-icon="mdi-plus" size="small">Create Event</v-btn>
            </div>

            <v-table theme="dark" class="bg-transparent table-custom">
              <thead>
                <tr>
                  <th class="text-left font-weight-bold">Name</th>
                  <th class="text-left font-weight-bold text-primary">Status</th>
                  <th class="text-left font-weight-bold text-secondary">Dates</th>
                  <th class="text-right font-weight-bold text-error">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="event in events" :key="event.id" class="border-b" style="border-color: rgba(0, 230, 118, 0.1) !important;">
                  <td class="py-3">
                    <div class="font-weight-bold text-subtitle-1">{{ event.name || event.title }}</div>
                    <div class="text-caption text-grey mt-1">{{ event.max_team_size }} Operatives Max</div>
                  </td>
                  <td style="width: 200px;">
                    <v-select
                      :model-value="event.status"
                      @update:model-value="forceChangeStatus(event, $event)"
                      :items="['draft', 'open', 'running', 'finished']"
                      density="compact" variant="outlined" hide-details
                    >
                      <template v-slot:selection="{ item }">
                        <v-chip size="small" :color="getStatusColor(item.title)" class="text-uppercase font-weight-black w-100 justify-center">
                          {{ item.title }}
                        </v-chip>
                      </template>
                    </v-select>
                  </td>
                  <td>
                    <div class="text-caption text-grey-lighten-1"><v-icon size="small" class="mr-1">mdi-clock-start</v-icon>{{ new Date(event.starts_at).toLocaleString() }}</div>
                    <div class="text-caption text-grey-lighten-1 mt-1"><v-icon size="small" class="mr-1" color="error">mdi-clock-end</v-icon>{{ new Date(event.ends_at).toLocaleString() }}</div>
                  </td>
                  <td class="text-right">
                    <v-btn v-if="event.status === 'draft'" size="small" icon="mdi-pencil" variant="text" color="primary" @click="openEditEventDialog(event)"></v-btn>
                    <v-btn v-if="event.status === 'draft' || event.status === 'finished'" size="small" icon="mdi-delete" variant="text" color="error" @click="confirmDeleteEvent(event)"></v-btn>
                    <span v-if="event.status !== 'draft'" class="text-caption text-grey">Locked</span>
                  </td>
                </tr>
                <tr v-if="events.length === 0">
                  <td colspan="4" class="text-center py-8 text-grey">No events found.</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-window-item>

        <!-- CHALLENGES TAB -->
        <v-window-item value="challenges">
          <v-card-text>
            <div class="d-flex justify-space-between align-center mb-6">
              <h2 class="text-h5 text-error font-weight-black hacker-text">Challenge Matrices</h2>
            </div>
            
            <v-select
              v-model="selectedEventId"
              :items="events"
              item-title="name"
              item-value="id"
              label="Select Event"
              variant="outlined" color="error" class="mb-6"
              @update:model-value="fetchChallenges"
            ></v-select>

            <template v-if="selectedEventId">
              <v-btn color="error" variant="outlined" class="mb-4" @click="openCreateChallengeDialog" prepend-icon="mdi-plus" size="small">Add Challenge</v-btn>
              
              <v-table theme="dark" class="bg-transparent table-custom">
                <thead>
                  <tr>
                    <th class="text-left text-error">Name</th>
                    <th class="text-left text-error">Category</th>
                    <th class="text-left text-error">Difficulty</th>
                    <th class="text-left text-error">Points</th>
                    <th class="text-left text-error">Visible</th>
                    <th class="text-center text-error">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="challenge in challenges" :key="challenge.id">
                    <td class="font-weight-bold text-primary">{{ challenge.title }}</td>
                    <td><v-chip size="x-small" variant="outlined" class="text-uppercase">{{ challenge.category }}</v-chip></td>
                    <td><v-chip :color="getDiffColor(challenge.difficulty)" size="x-small" variant="flat" class="text-uppercase font-weight-bold">{{ challenge.difficulty }}</v-chip></td>
                    <td>{{ challenge.points }}</td>
                    <td>
                      <v-chip :color="challenge.visible ? 'success' : 'grey'" size="small" variant="outlined">
                        {{ challenge.visible ? 'YES' : 'NO' }}
                      </v-chip>
                    </td>
                    <td class="text-center">
                      <v-btn size="small" class="mx-1" color="primary" variant="outlined" @click="openEditChallengeDialog(challenge)">EDIT</v-btn>
                      <v-btn size="small" class="mx-1" color="secondary" variant="outlined" @click="openSetFlagDialog(challenge)" prepend-icon="mdi-flag-variant">FLAG</v-btn>
                      <v-btn v-if="!challenge.visible" size="small" class="mx-1" color="success" variant="elevated" @click="publishChallenge(challenge.id)">PUBLISH</v-btn>
                    </td>
                  </tr>
                  <tr v-if="challenges.length === 0">
                    <td colspan="6" class="text-center py-8 text-grey">No challenges in this event.</td>
                  </tr>
                </tbody>
              </v-table>
            </template>
          </v-card-text>
        </v-window-item>

      </v-window>
    </v-card>

    <!-- Create/Edit Event Dialog -->
    <v-dialog v-model="eventDialog" max-width="500">
      <v-card class="glass-panel" border="primary" rounded="xl">
        <v-card-title class="text-primary font-weight-bold px-6 pt-6">{{ editModeEvent ? 'Edit Event' : 'Create New Event' }}</v-card-title>
        <v-card-text class="px-6">
          <v-alert v-if="eventDialogError" type="error" variant="tonal" class="mb-4">{{ eventDialogError }}</v-alert>
          <v-text-field v-model="eventForm.name" label="Event Name" variant="outlined" class="mb-3" :rules="[v => !!v || 'Required']"></v-text-field>
          <v-textarea v-model="eventForm.description" label="Description" variant="outlined" class="mb-3" rows="3"></v-textarea>
          <v-text-field v-model.number="eventForm.max_team_size" label="Max Team Size" type="number" variant="outlined" class="mb-3"></v-text-field>
          <v-text-field v-model="eventForm.starts_at" label="Starts At" type="datetime-local" variant="outlined" class="mb-3"></v-text-field>
          <v-text-field v-model="eventForm.ends_at" label="Ends At" type="datetime-local" variant="outlined"></v-text-field>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="eventDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveEvent" :loading="formLoading">Deploy</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit User Dialog -->
    <v-dialog v-model="userDialog" max-width="400">
      <v-card class="glass-panel" border="primary" rounded="xl">
        <v-card-title class="text-primary font-weight-bold px-6 pt-6">Edit Operative</v-card-title>
        <v-card-text class="px-6">
          <v-alert v-if="userDialogError" type="error" variant="tonal" class="mb-4">{{ userDialogError }}</v-alert>
          <v-text-field :model-value="selectedUser?.username" label="Username" variant="outlined" readonly class="mb-3"></v-text-field>
          <v-select v-model="editUserForm.role" :items="['user', 'admin']" label="Role" variant="outlined" class="mb-3"></v-select>
          <v-text-field v-model.number="editUserForm.points" label="Points" type="number" variant="outlined"></v-text-field>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="userDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="updateUser" :loading="formLoading">Submit</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Challenge Dialog (Create/Edit) -->
    <v-dialog v-model="challengeDialog" max-width="550">
      <v-card class="glass-panel" border="error" rounded="xl">
        <v-card-title class="text-error font-weight-bold px-6 pt-6">{{ editModeChallenge ? 'Edit Challenge' : 'New Challenge' }}</v-card-title>
        <v-card-text class="px-6">
          <v-alert v-if="challengeDialogError" type="error" variant="tonal" class="mb-4">{{ challengeDialogError }}</v-alert>
          <v-text-field v-model="challengeForm.title" label="Title" variant="outlined" class="mb-3"></v-text-field>
          <v-select v-model="challengeForm.category" :items="validCategories" label="Category" variant="outlined" class="mb-3"></v-select>
          <v-select v-model="challengeForm.difficulty" :items="['easy', 'medium', 'hard']" label="Difficulty" variant="outlined" class="mb-3"></v-select>
          <v-textarea v-model="challengeForm.description" label="Description" variant="outlined" class="mb-3" rows="3"></v-textarea>
          <v-text-field v-model.number="challengeForm.points" label="Points" type="number" variant="outlined" class="mb-3"></v-text-field>
          <v-text-field v-model="challengeForm.file_url" label="File URL (Optional)" variant="outlined" placeholder="https://..." class="mb-3"></v-text-field>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="challengeDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="saveChallenge" :loading="formLoading">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Set Flag Dialog -->
    <v-dialog v-model="flagDialog" max-width="400">
      <v-card class="glass-panel" border="success" rounded="xl">
        <v-card-title class="text-success font-weight-bold px-6 pt-6">Set Secret Flag</v-card-title>
        <v-card-text class="px-6">
          <v-alert v-if="flagDialogError" type="error" variant="tonal" class="mb-4">{{ flagDialogError }}</v-alert>
          <p class="mb-4 text-grey text-body-2">The flag will be securely hashed on the backend.</p>
          <v-text-field v-model="flagForm.flag" label="Flag" placeholder="golabs{...}" variant="outlined"></v-text-field>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="flagDialog = false">Cancel</v-btn>
          <v-btn color="success" @click="saveFlag" :loading="formLoading">Submit</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm Ban Dialog -->
    <ConfirmDialog
      v-model="banConfirmDialog"
      :title="banTarget?.banned ? 'Unban Operative' : 'Ban Operative'"
      :message="`Are you sure you want to ${banTarget?.banned ? 'unban' : 'ban'} ${banTarget?.username}?`"
      :confirm-text="banTarget?.banned ? 'Unban' : 'Ban'"
      :color="banTarget?.banned ? 'success' : 'error'"
      :icon="banTarget?.banned ? 'mdi-account-check' : 'mdi-account-cancel'"
      @confirm="executeBan"
    />

    <!-- Confirm Delete Event Dialog -->
    <ConfirmDialog
      v-model="deleteEventDialog"
      title="Delete Event"
      :message="`Are you sure you want to permanently delete '${deleteEventTarget?.name}'? This cannot be undone.`"
      confirm-text="Delete"
      color="error"
      icon="mdi-delete-alert"
      @confirm="executeDeleteEvent"
    />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/api'
import { useNotify } from '@/composables/useNotify'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const notify = useNotify()

const tab = ref('users')
const users = ref([])
const events = ref([])
const error = ref('')
const loading = ref(false)
const formLoading = ref(false)

const validCategories = ['web', 'pwn', 'rev', 'crypto', 'forensics', 'misc']

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'open': return 'secondary'
    case 'running': return 'success'
    case 'finished': return 'grey'
    case 'draft': default: return 'warning'
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

// ── Users ──────────────────────────────────────────────────────────────────────
const fetchUsers = async () => {
  try {
    loading.value = true
    const res = await api.get('/users')
    users.value = res.data.data || res.data || []
  } catch {
    error.value = 'Failed to load operatives.'
  } finally {
    loading.value = false
  }
}

const banConfirmDialog = ref(false)
const banTarget = ref(null)

const confirmToggleBan = (user) => {
  banTarget.value = user
  banConfirmDialog.value = true
}

const executeBan = async () => {
  banConfirmDialog.value = false
  if (!banTarget.value) return
  try {
    const action = banTarget.value.banned ? 'unban' : 'ban'
    await api.post(`/admin/users/${banTarget.value.id}/${action}`)
    notify.success(`User ${action}ned successfully.`)
    await fetchUsers()
  } catch (err) {
    notify.error(err.response?.data?.error || 'Action failed.')
  }
}

const userDialog = ref(false)
const userDialogError = ref('')
const selectedUser = ref(null)
const editUserForm = ref({ role: 'user', points: 0 })

const openEditUserDialog = (user) => {
  selectedUser.value = user
  editUserForm.value.role = user.role || 'user'
  editUserForm.value.points = user.points || 0
  userDialogError.value = ''
  userDialog.value = true
}

const updateUser = async () => {
  try {
    formLoading.value = true
    userDialogError.value = ''
    if (editUserForm.value.role !== selectedUser.value.role) {
      await api.post(`/admin/users/${selectedUser.value.id}/role`, { role: editUserForm.value.role })
    }
    if (editUserForm.value.points !== selectedUser.value.points) {
      await api.post(`/admin/users/${selectedUser.value.id}/points`, { points: editUserForm.value.points })
    }
    await fetchUsers()
    userDialog.value = false
    notify.success('User updated.')
  } catch (err) {
    userDialogError.value = err.response?.data?.error || 'Failed to update user.'
  } finally {
    formLoading.value = false
  }
}

// ── Events ─────────────────────────────────────────────────────────────────────
const fetchEvents = async () => {
  try {
    const res = await api.get('/events')
    events.value = res.data.data || res.data || []
  } catch {
    console.error('Failed to fetch events')
  }
}

const eventDialog = ref(false)
const editModeEvent = ref(false)
const selectedEventEditId = ref(null)
const eventDialogError = ref('')
const eventForm = ref({
  name: '', description: '', max_team_size: 4,
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16)
})

const openCreateEventDialog = () => {
  editModeEvent.value = false
  eventForm.value = {
    name: '', description: '', max_team_size: 4,
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  }
  eventDialogError.value = ''
  eventDialog.value = true
}

const openEditEventDialog = (ev) => {
  editModeEvent.value = true
  selectedEventEditId.value = ev.id
  eventForm.value = {
    name: ev.name || ev.title,
    description: ev.description,
    max_team_size: ev.max_team_size,
    starts_at: ev.starts_at ? new Date(ev.starts_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    ends_at: ev.ends_at ? new Date(ev.ends_at).toISOString().slice(0, 16) : new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  }
  eventDialogError.value = ''
  eventDialog.value = true
}

const saveEvent = async () => {
  try {
    formLoading.value = true
    eventDialogError.value = ''
    const payload = {
      name: eventForm.value.name,
      description: eventForm.value.description,
      max_team_size: Number(eventForm.value.max_team_size),
      starts_at: new Date(eventForm.value.starts_at).toISOString(),
      ends_at: new Date(eventForm.value.ends_at).toISOString(),
    }
    if (editModeEvent.value) {
      await api.put(`/events/${selectedEventEditId.value}`, payload)
    } else {
      await api.post('/events', payload)
    }
    eventDialog.value = false
    notify.success(editModeEvent.value ? 'Event updated.' : 'Event created.')
    await fetchEvents()
  } catch (err) {
    eventDialogError.value = err.response?.data?.error || 'Failed to save event.'
  } finally {
    formLoading.value = false
  }
}

const changeEventStatus = async (id, action) => {
  await api.post(`/events/${id}/${action}`)
}

const forceChangeStatus = async (event, targetStatus) => {
  const current = event.status
  if (current === targetStatus) return
  
  const states = ['draft', 'open', 'running', 'finished']
  const currentIndex = states.indexOf(current)
  const targetIndex = states.indexOf(targetStatus)
  
  if (targetIndex < currentIndex) {
    notify.error(`Cannot reverse state from ${current.toUpperCase()} to ${targetStatus.toUpperCase()}.`)
    await fetchEvents()
    return
  }
  
  try {
    if (currentIndex < 1 && targetIndex >= 1) await changeEventStatus(event.id, 'open')
    if (currentIndex < 2 && targetIndex >= 2) await changeEventStatus(event.id, 'start')
    if (currentIndex < 3 && targetIndex >= 3) await changeEventStatus(event.id, 'finish')
    notify.success(`Event status changed to ${targetStatus}.`)
    await fetchEvents()
  } catch (err) {
    notify.error('Status transition failed: ' + (err.response?.data?.error || err.message))
    await fetchEvents()
  }
}

const deleteEventDialog = ref(false)
const deleteEventTarget = ref(null)

const confirmDeleteEvent = (event) => {
  deleteEventTarget.value = event
  deleteEventDialog.value = true
}

const executeDeleteEvent = async () => {
  deleteEventDialog.value = false
  if (!deleteEventTarget.value) return
  try {
    await api.post(`/events/${deleteEventTarget.value.id}/delete`)
    notify.success('Event deleted successfully.')
    await fetchEvents()
  } catch (err) {
    notify.error(err.response?.data?.error || 'Failed to delete event.')
  }
}

// ── Challenges ──────────────────────────────────────────────────────────────────
const challenges = ref([])
const selectedEventId = ref(null)

const fetchChallenges = async () => {
  if (!selectedEventId.value) return
  try {
    const res = await api.get(`/events/${selectedEventId.value}/challenges`)
    challenges.value = res.data.data || res.data || []
  } catch {
    challenges.value = []
  }
}

const challengeDialog = ref(false)
const editModeChallenge = ref(false)
const challengeDialogError = ref('')
const selectedChallengeId = ref(null)
const challengeForm = ref({ title: '', difficulty: 'medium', category: 'web', description: '', points: 100, file_url: '' })

const openCreateChallengeDialog = () => {
  editModeChallenge.value = false
  challengeForm.value = { title: '', difficulty: 'medium', category: 'web', description: '', points: 100, file_url: '' }
  challengeDialogError.value = ''
  challengeDialog.value = true
}

const openEditChallengeDialog = (challenge) => {
  editModeChallenge.value = true
  selectedChallengeId.value = challenge.id
  challengeForm.value = {
    title: challenge.title,
    difficulty: challenge.difficulty || 'medium',
    category: challenge.category,
    description: challenge.description,
    points: challenge.points,
    file_url: challenge.file_url || ''
  }
  challengeDialogError.value = ''
  challengeDialog.value = true
}

const saveChallenge = async () => {
  try {
    formLoading.value = true
    challengeDialogError.value = ''
    const payload = {
      title: challengeForm.value.title,
      difficulty: challengeForm.value.difficulty,
      category: challengeForm.value.category,
      description: challengeForm.value.description,
      points: Number(challengeForm.value.points),
      file_url: challengeForm.value.file_url || undefined
    }
    if (editModeChallenge.value) {
      await api.put(`/events/${selectedEventId.value}/challenges/${selectedChallengeId.value}`, payload)
    } else {
      await api.post(`/events/${selectedEventId.value}/challenges`, payload)
    }
    await fetchChallenges()
    challengeDialog.value = false
    notify.success(editModeChallenge.value ? 'Challenge updated.' : 'Challenge created.')
  } catch (err) {
    challengeDialogError.value = err.response?.data?.error || 'Failed to save challenge.'
  } finally {
    formLoading.value = false
  }
}

const publishChallenge = async (cid) => {
  try {
    await api.post(`/events/${selectedEventId.value}/challenges/${cid}/publish`)
    notify.success('Challenge published.')
    await fetchChallenges()
  } catch (err) {
    notify.error(err.response?.data?.error || 'Failed to publish.')
  }
}

const flagDialog = ref(false)
const flagDialogError = ref('')
const flagForm = ref({ flag: '' })

const openSetFlagDialog = (challenge) => {
  selectedChallengeId.value = challenge.id
  flagForm.value.flag = ''
  flagDialogError.value = ''
  flagDialog.value = true
}

const saveFlag = async () => {
  try {
    formLoading.value = true
    flagDialogError.value = ''
    await api.post(`/events/${selectedEventId.value}/challenges/${selectedChallengeId.value}/flag`, { flag: flagForm.value.flag })
    flagDialog.value = false
    notify.success('Flag set successfully.')
  } catch (err) {
    flagDialogError.value = err.response?.data?.error || 'Failed to set flag.'
  } finally {
    formLoading.value = false
  }
}

onMounted(() => {
  fetchUsers()
  fetchEvents()
})
</script>

<style scoped>
.admin-page { min-height: 100vh; }
.admin-header { text-shadow: 0 0 10px rgba(255, 23, 68, 0.3); letter-spacing: 1px; }
.hacker-text { text-shadow: 0 0 8px rgba(255, 23, 68, 0.3); }
.glass-panel {
  background: rgba(18, 24, 38, 0.8) !important;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 23, 68, 0.2) !important;
}
.table-custom { background: transparent !important; }
.table-custom th { font-weight: 900 !important; border-bottom: 2px solid #ff1744 !important; }
.table-custom td { border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important; }
</style>
