import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // La opción 'rollupOptions' se usa para configurar cómo Rollup (el bundler interno de Vite)
    // empaqueta tu código.
    rollupOptions: {
      // 'external' le dice a Rollup que no intente incluir ciertos módulos en el bundle final,
      // sino que asuma que ya estarán disponibles en el entorno de ejecución.
      // Esto soluciona el error "react/jsx-runtime".
      external: ['react/jsx-runtime'], 
    },
  },
});