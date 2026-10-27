import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { AuthProvider } from '@/features/auth';

/** Renderiza rotas com os providers do app: TanStack Query, sessão e router (FE-10). */
export function renderizar(rotas: RouteObject[], { caminho = '/' }: { caminho?: string } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(rotas, { initialEntries: [caminho] });
  const usuario = userEvent.setup();

  const resultado = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );

  return { ...resultado, router, usuario, queryClient };
}
