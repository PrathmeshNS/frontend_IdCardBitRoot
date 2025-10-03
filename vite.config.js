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
    // Allow Render's frontend hostname so Vite doesn't block requests from it
    // when running on Render. You can add more hosts to this array as needed
    // or set it to 'all' to allow any host (less secure).
    allowedHosts: [
      'frontend-idcardbitroot.onrender.com'
    ],
    proxy: {
      '/api': {
        target: 'https://backend-idcardbitroot.onrender.com',
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