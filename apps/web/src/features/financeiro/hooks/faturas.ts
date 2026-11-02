import {
  ehApiError,
  faturasDoContrato,
  getFaturasDoContratoQueryKey,
  type FaturaResponse,
  type StatusFatura,
} from '@ampara/api-client';
import { useQueries, useQuery } from '@tanstack/react-query';

// Faturas do COB-01 pelo client gerado (GET /contratos/{id}/faturas).
export {
  getFaturasDoContratoQueryKey,
  getFaturasDoContratoUrl,
  type FaturaResponse,
  type FormaPagamento,
  type StatusFatura,
} from '@ampara/api-client';

// Enquanto um Pix ou boleto aguarda confirmação, a lista se atualiza sozinha (COB-06).
const ATUALIZAR_EM_PROCESSAMENTO = 10_000;
const atualizarSeProcessando = (query: { state: { data?: FaturaResponse[] } }) =>
  query.state.data?.some((f) => f.status === 'PROCESSANDO') ? ATUALIZAR_EM_PROCESSAMENTO : false;

/**
 * O Financeiro só conhece o contrato depois de criar a assinatura (COB-01). Até lá ele responde
 * 404 Fatura.ContratoNaoEncontrado, que para quem usa quer dizer "ainda não há faturas".
 */
const opcoesDasFaturas = (idContrato: string) => ({
  queryKey: getFaturasDoContratoQueryKey(idContrato),
  queryFn: async ({ signal }: { signal: AbortSignal }) => {
    try {
      return await faturasDoContrato(idContrato, { signal });
    } catch (erro) {
      if (ehApiError(erro) && erro.codigo === 'Fatura.ContratoNaoEncontrado') return [];
      throw erro;
    }
  },
  refetchInterval: atualizarSeProcessando,
});

/** Faturas de um contrato. */
export function useFaturasDoContrato(idContrato: string | undefined) {
  return useQuery({ ...opcoesDasFaturas(idContrato ?? ''), enabled: Boolean(idContrato) });
}

/** Faturas de vários contratos juntas, da mais recente para a mais antiga. */
export function useFaturasDosContratos(idsContratos: string[]) {
  return useQueries({
    queries: idsContratos.map(opcoesDasFaturas),
    combine: (resultados) => {
      const erro = resultados.find((r) => r.isError);
      return {
        data: resultados.every((r) => r.data)
          ? resultados
              .flatMap((r) => r.data ?? [])
              .sort((a, b) => b.data_vencimento.localeCompare(a.data_vencimento))
          : undefined,
        isPending: resultados.some((r) => r.isPending),
        isError: Boolean(erro),
        error: erro?.error ?? null,
        refetch: () => Promise.all(resultados.map((r) => r.refetch())),
      };
    },
  });
}

/** A fatura que pede atenção primeiro: atrasada, depois em aberto, depois em processamento. */
export function faturaEmDestaque(faturas: FaturaResponse[]) {
  const ordem: StatusFatura[] = ['VENCIDA', 'PENDENTE', 'PROCESSANDO'];
  return [...faturas]
    .filter((f) => ordem.includes(f.status))
    .sort(
      (a, b) =>
        ordem.indexOf(a.status) - ordem.indexOf(b.status) ||
        a.data_vencimento.localeCompare(b.data_vencimento),
    )[0];
}

/** Multa e juros a mostrar antes de pagar: os estimados para hoje, ou os já lançados (COB-09). */
export const encargosDaFatura = (fatura: FaturaResponse) =>
  Number(fatura.encargos_estimados) || Number(fatura.valor_multa_juros) || 0;
