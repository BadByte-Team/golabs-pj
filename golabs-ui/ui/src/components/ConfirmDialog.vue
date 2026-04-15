<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="420" persistent>
    <v-card class="confirm-card" rounded="xl" border="error">
      <v-card-title class="d-flex align-center pt-6 px-6">
        <v-icon :color="color" class="mr-3" size="28">{{ icon }}</v-icon>
        <span class="text-h6 font-weight-bold">{{ title }}</span>
      </v-card-title>

      <v-card-text class="px-6 pt-4 pb-2 text-body-1 text-grey-lighten-1">
        {{ message }}
      </v-card-text>

      <v-card-actions class="pa-6 pt-2">
        <v-spacer></v-spacer>
        <v-btn variant="text" color="grey" @click="$emit('update:modelValue', false)">
          {{ cancelText }}
        </v-btn>
        <v-btn :color="color" variant="elevated" class="font-weight-bold" @click="$emit('confirm')">
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  color?: string
  icon?: string
}>(), {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  color: 'error',
  icon: 'mdi-alert-circle-outline',
})

defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
}>()
</script>

<style scoped>
.confirm-card {
  background: rgba(18, 24, 38, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 23, 68, 0.3) !important;
}
</style>
