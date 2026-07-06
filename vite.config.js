import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base musi pasować do ścieżki na GitHub Pages: https://riceookie.github.io/biblioteczka/
export default defineConfig({
  plugins: [react()],
  base: '/biblioteczka/',
})
