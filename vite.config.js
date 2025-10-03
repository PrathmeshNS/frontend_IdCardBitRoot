import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to all network interfaces so Render (or other hosts) can detect the
    // listening port. Use the PORT env var when provided by the host platform
    // (e.g. Render) so the process binds to the correct port.
    host: true,
    port: Number(process.env.PORT) || 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})