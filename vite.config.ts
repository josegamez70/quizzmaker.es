import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Ahora, 'external' incluye ambos módulos: 'react' y 'react/jsx-runtime'.
      // Esto soluciona ambos errores de resolución.
      external: ['react', 'react/jsx-runtime'], 
    },
  },
});