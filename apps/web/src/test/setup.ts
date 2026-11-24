import '@testing-library/jest-dom/vitest';
import { configurarCliente } from '@ampara/api-client';
import { cleanup, configure } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { encerrarSessao, obterAccessToken, renovarAccessToken } from '@/features/auth';

// O jsdom não tem ResizeObserver, usado pelos componentes do Radix (Checkbox).
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

/**
 * API simulada (FE-10). Sem cookie de refresh por padrão: o app abre sem sessão.
 * Cada teste declara as respostas de que precisa (com os mocks do Orval, de @ampara/api-client/mocks,
 * ou com http.get/post). Não carregamos todos os mocks aqui: eles importam o Faker inteiro,
 * o que deixa cada arquivo de teste lento para iniciar.
 */
export const servidor = setupServer(
  http.post('*/api/v1/auth/refresh', () =>
    HttpResponse.json({ detail: 'Sessão expirada. Faça login novamente.' }, { status: 401 }),
  ),
);

// findBy* e waitFor esperam até 5s (padrão: 1s): telas com várias consultas demoram mais
// quando os testes rodam em paralelo em máquinas mais modestas.
configure({ asyncUtilTimeout: 5_000 });

configurarCliente({
  baseUrl: 'http://localhost:5173',
  obterToken: obterAccessToken,
  obterTenant: () => 'demo',
  renovarSessao: renovarAccessToken,
  aoSessaoExpirar: encerrarSessao,
});

beforeAll(() => servidor.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  cleanup();
  servidor.resetHandlers();
  encerrarSessao();
});
afterAll(() => servidor.close());
