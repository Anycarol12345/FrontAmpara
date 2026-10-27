import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'http://localhost:5173' } },
    setupFiles: ['./src/test/setup.ts'],
    // Cada worker sobe um jsdom; metade dos núcleos evita estourar a memória em máquinas mais modestas.
    maxWorkers: '50%',
    // Testes de tela digitam como o usuário; 15s dá folga em máquinas lentas e no CI.
    testTimeout: 15_000,
    include: ['src/**/*.test.{ts,tsx}'],
    // Testes não dependem do .env de quem roda: mesmos valores em qualquer máquina e no CI.
    env: { VITE_TENANT_PADRAO: '', VITE_DOMINIO_BASE: 'localhost' },
    coverage: {
      provider: 'v8',
      include: ['src/shared/lib/**', 'src/features/**/schemas/**', 'src/features/auth/**'],
      exclude: ['**/*.test.*', '**/index.ts'],
      thresholds: { lines: 70, functions: 70, branches: 60, statements: 70 },
    },
  },
});
