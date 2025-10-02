import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['shutdown-team.ru'],
    host: true,
  },
  css: {
    transformer: 'postcss'
  }
})
