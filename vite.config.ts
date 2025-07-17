import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Esta es la lista COMPLETA de módulos que Rollup debe tratar como 'externos'.
      // Ahora incluye 'react', 'react/jsx-runtime', 'react-dom/client', 
      // '@supabase/supabase-js' y '@google/generative-ai'.
      external: [
        'react', 
        'react/jsx-runtime', 
        'react-dom/client', 
        '@supabase/supabase-js',
        '@google/generative-ai' // <-- ¡NUEVA LÍNEA AÑADIDA!
      ], 
    },
  },
});