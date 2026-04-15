/**
 * plugins/vuetify.ts
 */
import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          primary: '#00e676', // Hacker fluorescent green
          secondary: '#18ffff', // Cyan magic
          background: '#0a0e17', // Deep dark blueish grey
          surface: '#121826', // slightly lighter for cards
          error: '#ff1744',
          info: '#2196f3',
          success: '#4caf50',
          warning: '#ffc107',
        },
      },
    },
  },
})
