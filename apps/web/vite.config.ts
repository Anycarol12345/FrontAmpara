import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const api = env.VITE_API_PROXY || 'http://localhost:5080';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      // Mesma origem para a API: o cookie de refresh (SameSite=Strict) funciona sem CORS.
      proxy: {
        '/api': { target: api, changeOrigin: false },
        '/hubs': { target: api, changeOrigin: false, ws: true },
      },
    },
  };
});
