<template>
  <v-app class="bg-background">
    <NavBar />
    <v-main>
      <router-view v-slot="{ Component }">
        <v-fade-transition hide-on-leave>
          <component :is="Component" />
        </v-fade-transition>
      </router-view>
    </v-main>

    <!-- Global notification snackbar -->
    <v-snackbar
      v-model="snackbar.show.value"
      :color="snackbar.color.value"
      :timeout="snackbar.timeout.value"
      location="bottom end"
      rounded="lg"
      elevation="8"
      class="mb-4"
    >
      {{ snackbar.message.value }}
      <template v-slot:actions>
        <v-btn variant="text" icon="mdi-close" size="small" @click="snackbar.show.value = false"></v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'
import { useNotify } from '@/composables/useNotify'

const snackbar = useNotify()
</script>

<style>
/* Global aesthetics like custom scrollbar or reset */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #0a0e17;
}
::-webkit-scrollbar-thumb {
  background: #00e676;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #18ffff;
}
</style>
