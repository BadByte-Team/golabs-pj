import { ref, readonly } from 'vue'

// ── Singleton state ────────────────────────────────────────────────────────────
const show = ref(false)
const message = ref('')
const color = ref<'success' | 'error' | 'info' | 'warning'>('info')
const timeout = ref(4000)

export function useNotify() {
  function notify(msg: string, c: typeof color.value = 'info', ms = 4000): void {
    message.value = msg
    color.value = c
    timeout.value = ms
    show.value = true
  }

  function success(msg: string): void {
    notify(msg, 'success')
  }

  function error(msg: string): void {
    notify(msg, 'error', 5000)
  }

  function info(msg: string): void {
    notify(msg, 'info')
  }

  function warning(msg: string): void {
    notify(msg, 'warning')
  }

  return {
    show,
    message: readonly(message),
    color: readonly(color),
    timeout: readonly(timeout),
    success,
    error,
    info,
    warning,
  }
}
