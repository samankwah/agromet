import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     hmr: {
//       overlay: false,
//     },
//   },
// });

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/translate": {
        target: "https://translation.ghananlp.org/translate",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/translate/, ""),
        headers: {
          "Ocp-Apim-Subscription-Key": "c7540cd770e24a57ad5171e6a9ef3d1d",
        },
      },
      "/api/tts": {
        target: "https://translation-api.ghananlp.org/tts/v1",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tts/, ""),
        headers: {
          "Ocp-Apim-Subscription-Key": "c7540cd770e24a57ad5171e6a9ef3d1d",
        },
      },
      "/api/tts/speakers": {
        target: "https://translation-api.ghananlp.org/tts/v1/speakers",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tts\/speakers/, ""),
        headers: {
          "Ocp-Apim-Subscription-Key": "c7540cd770e24a57ad5171e6a9ef3d1d",
        },
      },
      "/api/tts/languages": {
        target: "https://translation-api.ghananlp.org/tts/v1/languages",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tts\/languages/, ""),
        headers: {
          "Ocp-Apim-Subscription-Key": "c7540cd770e24a57ad5171e6a9ef3d1d",
        },
      },
      "/api/tts/synthesize": {
        target: "https://translation-api.ghananlp.org/tts/v1/synthesize",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tts\/synthesize/, ""),
        headers: {
          "Ocp-Apim-Subscription-Key": "c7540cd770e24a57ad5171e6a9ef3d1d",
        },
      },
      "/api/tts/tts": {
        target: "https://translation-api.ghananlp.org/tts/v1/tts",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tts\/tts/, ""),
        headers: {
          "Ocp-Apim-Subscription-Key": "c7540cd770e24a57ad5171e6a9ef3d1d",
        },
      },
      "/api/v1/translate": {
        target: "https://translation-api.ghananlp.org/v1/translate",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/translate/, ""),
        headers: {
          "Ocp-Apim-Subscription-Key": "c7540cd770e24a57ad5171e6a9ef3d1d",
        },
      },
      "/api/v1/languages": {
        target: "https://translation-api.ghananlp.org/v1/languages",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/languages/, ""),
        headers: {
          "Ocp-Apim-Subscription-Key": "c7540cd770e24a57ad5171e6a9ef3d1d",
        },
      },
      "/api/asr/transcribe": {
        target: "https://translation-api.ghananlp.org/asr/v1/transcribe",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/asr\/transcribe/, ""),
        headers: {
          "Ocp-Apim-Subscription-Key": "c7540cd770e24a57ad5171e6a9ef3d1d",
        },
      },
      "/api/ambee": {
        target: "https://api.ambeedata.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ambee/, ""),
      },
    },
  },
});
