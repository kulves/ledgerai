import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss() // 🚀 Processes your utility classes directly during compilation passes
  ],
  base: './', // Crucial relative routing parameter for Electron asset tracking
})