import { configurarCliente } from '@ampara/api-client';
import { Toaster } from '@ampara/ui/components/sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useState, type ReactNode } from 'react';
import {
  AuthProvider,
  encerrarSessao,
  obterAccessToken,
  renovarAccessToken,
  useAuth,
} from '@/features/auth';
import { env } from '@/shared/lib/env';
import { criarQueryClient } from '@/shared/lib/queryClient';
import { obterSlugDoTenant } from '@/shared/lib/tenant';
import { TempoRealProvider } from '@/shared/tempo-real/TempoRealProvider';

// Client da API (FE-04) ligado à sessão (FE-07). Configurado antes da primeira requisição.
configurarCliente({
  baseUrl: env.apiUrl,
  obterToken: obterAccessToken,
  obterTenant: () => obterSlugDoTenant(),
  renovarSessao: renovarAccessToken,
  aoSessaoExpirar: encerrarSessao,
});

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })),
    )
  : () => null;

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(criarQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TempoRealDaSessao>{children}</TempoRealDaSessao>
      </AuthProvider>
      <Toaster />
      <Suspense>
        <ReactQueryDevtools buttonPosition="bottom-left" />
      </Suspense>
    </QueryClientProvider>
  );
}

/** A conexão em tempo real (FE-08) existe só enquanto há sessão e cai no logout. */
function TempoRealDaSessao({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  return (
    <TempoRealProvider ativo={status === 'autenticado'} obterToken={obterAccessToken}>
      {children}
    </TempoRealProvider>
  );
}
