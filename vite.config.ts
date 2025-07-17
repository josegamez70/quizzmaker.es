import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Esta es la lista COMPLETA de módulos que Rollup debe tratar como 'externos'.
      // Hemos quitado '@google/generative-ai' de esta lista para que sea empaquetado.
      external: [
        'react', 
        'react/jsx-runtime', 
        'react-dom/client', 
        '@supabase/supabase-js' 
        // ¡QUITAMOS: '@google/generative-ai' de aquí!
      ], 
    },
  },
});