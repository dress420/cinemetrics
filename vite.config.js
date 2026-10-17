import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Macht die Vercel-Funktionen aus /api auch bei `npm run dev` / `npm run preview` verfügbar
const localApi = () => {
  const mount = (server) => {
    server.middlewares.use('/api/letterboxd', async (req, res) => {
      const { default: handler } = await import('./api/letterboxd.js')
      handler(req, res)
    })
  }
  return { name: 'local-api', configureServer: mount, configurePreviewServer: mount }
}

export default defineConfig({
  plugins: [react(), localApi()],
  build: { outDir: 'dist' },
})
