import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const repoName = 'security-activity-monitoring-system'

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? `/${repoName}/` : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})