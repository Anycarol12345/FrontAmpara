import { ehApiError } from '@ampara/api-client';
import { toast } from '@ampara/ui/components/sonner';
import { MutationCache, QueryCache, QueryClient, type QueryKey } from '@tanstack/react-query';

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: {
      /** Não mostrar o toast de erro (a tela trata o erro sozinha). */
      silenciarErro?: boolean;
    };
    mutationMeta: {
      silenciarErro?: boolean;
      /** Consultas a invalidar depois do sucesso (padrão de invalidação do FE-05). */
      invalida?: QueryKey[];
    };
  }
}

/** Erros que a própria tela mostra: validação vai para os campos (FE-06) e 401 vira logout (FE-07). */
function deveMostrarToast(erro: unknown) {
  if (!ehApiError(erro)) return true;
  return !erro.ehValidacao && erro.status !== 401;
}

export function criarQueryClient() {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (erro, query) => {
        if (!query.meta?.silenciarErro && deveMostrarToast(erro)) toast.error(erro.message);
      },
    }),
    mutationCache: new MutationCache({
      onError: (erro, _variaveis, _contexto, mutation) => {
        if (!mutation.meta?.silenciarErro && deveMostrarToast(erro)) toast.error(erro.message);
      },
      onSuccess: (_dados, _variaveis, _contexto, mutation) => {
        for (const queryKey of mutation.meta?.invalida ?? []) {
          void queryClient.invalidateQueries({ queryKey });
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        // Erros 4xx não melhoram tentando de novo; falhas de rede e 5xx tentam até 2 vezes.
        retry: (tentativas, erro) => {
          if (ehApiError(erro) && erro.status >= 400 && erro.status < 500) return false;
          return tentativas < 2;
        },
      },
      mutations: { retry: false },
    },
  });

  return queryClient;
}
