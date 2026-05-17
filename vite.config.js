import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/react') || id.includes('react-router-dom')) return 'vendor-react';
          if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('sonner')) {
            return 'vendor-ui';
          }
          if (id.includes('recharts')) return 'vendor-charts';
          if (id.includes('@supabase')) return 'vendor-supabase';
          return 'vendor';
        },
      },
    },
  },
});
