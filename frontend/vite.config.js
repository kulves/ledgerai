import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss() // 🚀 Direct injection pipeline handles compilation passes before minification
  ],
  base: './', // Crucial relative routing parameter for Electron window frames
})