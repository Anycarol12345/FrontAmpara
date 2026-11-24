import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

// O jsdom não tem ResizeObserver, usado pelos componentes do Radix (Checkbox).
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

/** API simulada (MSW). Cada teste declara as respostas de que precisa. */
export const servidor = setupServer();

beforeAll(() => servidor.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  cleanup();
  servidor.resetHandlers();
});
afterAll(() => servidor.close());
