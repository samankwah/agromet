import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_BASE_URL || 'http://localhost:8000';

  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');

            // Recharts re-exports modules that depend on one another. Keeping
            // them together avoids a circular production chunk initialization.
            if (normalizedId.includes('/node_modules/recharts/')) {
              return 'recharts-vendor';
            }

            return undefined;
          },
        },
      },
    },
  };
});
