import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const configured = loadEnv(mode, '..', '')
  const demoEmail = configured.VITE_DEMO_EMAIL || configured.DEMO_EMAIL || ''
  const demoPassword = configured.VITE_DEMO_PASSWORD || configured.DEMO_PASSWORD || ''
  return {
  envDir: '..',
  define: {
    'import.meta.env.VITE_DEMO_EMAIL': JSON.stringify(demoEmail),
    'import.meta.env.VITE_DEMO_PASSWORD': JSON.stringify(demoPassword),
  },
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: configured.VITE_API_URL || `http://127.0.0.1:${configured.BACKEND_PORT || 3001}`,
        changeOrigin: true,
      }
    }
  }
  }
})
