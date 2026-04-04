import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
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
          const normalizedId = id.replace(/\\/g, "/");

          if (!normalizedId.includes("/node_modules/")) {
            return undefined;
          }

          if (
            normalizedId.includes("/node_modules/react/") ||
            normalizedId.includes("/node_modules/react-dom/") ||
            normalizedId.includes("/node_modules/react-router/") ||
            normalizedId.includes("/node_modules/react-router-dom/")
          ) {
            return "react-vendor";
          }

          if (
            normalizedId.includes("/node_modules/leaflet/") ||
            normalizedId.includes("/node_modules/react-leaflet/")
          ) {
            return "map-vendor";
          }

          if (
            normalizedId.includes("/node_modules/html2pdf.js/") ||
            normalizedId.includes("/node_modules/html2canvas/") ||
            normalizedId.includes("/node_modules/jspdf/") ||
            normalizedId.includes("/node_modules/jspdf-autotable/")
          ) {
            return "pdf-vendor";
          }

          if (
            normalizedId.includes("/node_modules/framer-motion/") ||
            normalizedId.includes("/node_modules/motion-dom/") ||
            normalizedId.includes("/node_modules/motion-utils/") ||
            normalizedId.includes("/node_modules/react-remove-scroll/") ||
            normalizedId.includes("/node_modules/react-remove-scroll-bar/") ||
            normalizedId.includes("/node_modules/react-style-singleton/") ||
            normalizedId.includes("/node_modules/use-callback-ref/") ||
            normalizedId.includes("/node_modules/use-sidecar/")
          ) {
            return "motion-vendor";
          }

          if (
            normalizedId.includes("/node_modules/recharts/") ||
            normalizedId.includes("/node_modules/chart.js/") ||
            normalizedId.includes("/node_modules/react-chartjs-2/") ||
            normalizedId.includes("/node_modules/@amcharts/amcharts5/") ||
            normalizedId.includes("/node_modules/d3-")
          ) {
            return "charts-vendor";
          }

          if (
            normalizedId.includes("/node_modules/xlsx/") ||
            normalizedId.includes("/node_modules/cfb/") ||
            normalizedId.includes("/node_modules/codepage/") ||
            normalizedId.includes("/node_modules/crc-32/") ||
            normalizedId.includes("/node_modules/ssf/") ||
            normalizedId.includes("/node_modules/wmf/")
          ) {
            return "xlsx-vendor";
          }

          if (
            normalizedId.includes("/node_modules/axios/") ||
            normalizedId.includes("/node_modules/axios-retry/")
          ) {
            return "axios-vendor";
          }

          if (
            normalizedId.includes("/node_modules/core-js/") ||
            normalizedId.includes("/node_modules/@babel/runtime/") ||
            normalizedId.includes("/node_modules/regenerator-runtime/")
          ) {
            return "polyfills-vendor";
          }

          if (
            normalizedId.includes("/node_modules/@paakways/ghananlp-node/") ||
            normalizedId.includes("/node_modules/es-toolkit/")
          ) {
            return "ai-vendor";
          }

          if (
            normalizedId.includes("/node_modules/react-slick/") ||
            normalizedId.includes("/node_modules/slick-carousel/")
          ) {
            return "carousel-vendor";
          }

          if (normalizedId.includes("/node_modules/firebase/")) {
            return "firebase-vendor";
          }

          if (
            normalizedId.includes("/node_modules/react-icons/") ||
            normalizedId.includes("/node_modules/lucide-react/")
          ) {
            return "icons-vendor";
          }

          return "vendor";
        },
      },
    },
  },
});
