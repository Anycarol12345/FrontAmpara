import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // lib/api.ts é só do servidor; nos testes o pacote server-only não precisa barrar nada.
      'server-only': fileURLToPath(new URL('./src/test/vazio.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'http://localhost:3000' } },
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Threads gastam menos memória que processos: os testes não travam em máquinas mais modestas.
    pool: 'threads',
    maxWorkers: '50%',
    testTimeout: 15_000,
  },
});
