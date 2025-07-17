import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Configuración de Rollup para especificar módulos que deben ser tratados como externos.
    // Esto resuelve los errores "failed to resolve import" para React, React DOM y Supabase.
    rollupOptions: {
      external: [
        'react', 
        'react/jsx-runtime', 
        'react-dom/client', 
        '@supabase/supabase-js'
      ], 
    },
  },
});