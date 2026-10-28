import { requisicao } from '@ampara/api-client';
import { useQueries, useQuery } from '@tanstack/react-query';

// Escrito à mão a partir do COB-01 enquanto o backend não publica o módulo Financeiro.
// Quando o endpoint entrar no OpenAPI, troque por useFaturasDoContrato do Orval (pnpm api:generate).

export type StatusFatura = 'PENDENTE' | 'PROCESSANDO' | 'PAGA' | 'VENCIDA' | 'CANCELADA';
export type FormaPagamento = 'CARTAO' | 'PIX' | 'BOLETO' | 'MANUAL';

export type FaturaResponse = {
  id_fatura: string;
  id_contrato: string;
  /** aaaa-mm */
  competencia: string;
  valor: number;
  /** Multa e juros calculados pelo sistema quando a fatura está atrasada (COB-09). */
  valor_multa_juros: number;
  data_vencimento: string;
  status: StatusFatura;
  forma_pagamento: FormaPagamento | null;
  /** Página de pagamento hospedada pelo Stripe (Pix, boleto ou cartão). */
  link_pagamento: string | null;
  data_pagamento: string | null;
};

export const getFaturasDoContratoUrl = (idContrato: string) =>
  `/api/v1/contratos/${idContrato}/faturas`;

export const getFaturasDoContratoQueryKey = (idContrato: string) =>
  [getFaturasDoContratoUrl(idContrato)] as const;

export const faturasDoContrato = (idContrato: string, signal?: AbortSignal) =>
  requisicao<FaturaResponse[]>(getFaturasDoContratoUrl(idContrato), { signal });

// Enquanto um Pix ou boleto aguarda confirmação, a lista se atualiza sozinha (COB-06).
const ATUALIZAR_EM_PROCESSAMENTO = 10_000;

const opcoes = (idContrato: string) => ({
  queryKey: getFaturasDoContratoQueryKey(idContrato),
  queryFn: ({ signal }: { signal: AbortSignal }) => faturasDoContrato(idContrato, signal),
  refetchInterval: (query: { state: { data?: FaturaResponse[] } }) =>
    query.state.data?.some((f) => f.status === 'PROCESSANDO') ? ATUALIZAR_EM_PROCESSAMENTO : false,
});

/** Faturas de um contrato (GET /contratos/{id}/faturas). */
export function useFaturasDoContrato(idContrato: string | undefined) {
  return useQuery({ ...opcoes(idContrato ?? ''), enabled: Boolean(idContrato) });
}

/** Faturas de vários contratos juntas, da mais recente para a mais antiga. */
export function useFaturasDosContratos(idsContratos: string[]) {
  return useQueries({
    queries: idsContratos.map(opcoes),
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
