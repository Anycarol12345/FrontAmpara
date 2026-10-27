import '@testing-library/jest-dom/vitest';
import { configurarCliente } from '@ampara/api-client';
import { handlersPadrao } from '@ampara/api-client/mocks';
import { cleanup } from '@testing-library/react';
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

/** API simulada com os mocks do Orval (FE-10). Sem cookie de refresh por padrão: o app abre sem sessão. */
export const servidor = setupServer(
  http.post('*/api/v1/auth/refresh', () =>
    HttpResponse.json({ detail: 'Sessão expirada. Faça login novamente.' }, { status: 401 }),
  ),
  ...handlersPadrao(),
);

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
