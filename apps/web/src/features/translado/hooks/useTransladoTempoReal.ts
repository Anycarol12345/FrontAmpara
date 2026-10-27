import { useQueryClient } from '@tanstack/react-query';
import { useEventoTempoReal } from '@/shared/tempo-real/contexto';

/** Evento publicado pelo backend a cada transição do translado (TRA-06, ARQ-01). */
export const EVENTO_TRANSLADO = 'TransladoStatusAlterado';

export type TransladoStatusAlterado = {
  id_translado: string;
  status: 'AGENDADO' | 'EM_COLETA' | 'EM_TRANSITO' | 'ENTREGUE' | 'CANCELADO';
  alterado_em: string;
};

// Prefixos das consultas de translado geradas pelo Orval (a query key começa pela URL).
const ROTAS_TRANSLADO = [
  '/api/v1/translados',
  '/api/v1/gestao/translados',
  '/api/v1/terceiros/translados',
];

/**
 * Atualiza as telas de translado quando o status muda (FE-08).
 * Com `idTranslado`, só reage a esse translado; sem ele, a qualquer um.
 */
export function useTransladoTempoReal(
  idTranslado?: string,
  aoAlterar?: (evento: TransladoStatusAlterado) => void,
) {
  const queryClient = useQueryClient();

  useEventoTempoReal<TransladoStatusAlterado>(EVENTO_TRANSLADO, (evento) => {
    if (idTranslado && evento.id_translado !== idTranslado) return;

    void queryClient.invalidateQueries({
      predicate: ({ queryKey }) => {
        const [rota] = queryKey;
        return (
          typeof rota === 'string' && ROTAS_TRANSLADO.some((prefixo) => rota.startsWith(prefixo))
        );
      },
    });
    aoAlterar?.(evento);
  });
}
