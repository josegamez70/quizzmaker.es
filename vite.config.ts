import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Esta es la lista completa de módulos que Rollup debe tratar como 'externos'.
      // Incluye 'react', 'react/jsx-runtime' y ahora 'react-dom/client'.
      external: ['react', 'react/jsx-runtime', 'react-dom/client'], 
    },
  },
});