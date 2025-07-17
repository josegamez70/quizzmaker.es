import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
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