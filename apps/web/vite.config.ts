import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: Number(process.env.WEB_PORT),
    strictPort: true,
  },
  plugins: [tanstackStart(), react()],
})
