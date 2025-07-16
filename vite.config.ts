// vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Le decimos a Vite que no intente empaquetar esta librería,
  // ya que causa problemas en el entorno de Netlify.
  build: {
    rollupOptions: {
      external: [
        '@google/generative-ai'
      ]
    }
  }
})