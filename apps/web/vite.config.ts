import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: Number(process.env.WEB_PORT),
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT}`,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [tailwindcss(), tanstackStart(), react()],
})
