import { requisicao } from '@ampara/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';

// Escrito à mão a partir do FUN-02 enquanto o backend não publica o módulo Funeral.
// Quando o endpoint entrar no OpenAPI, troque pelos hooks do Orval (pnpm api:generate).

export type DestinoFuneral = 'SEPULTAMENTO' | 'CREMACAO';

export type ItemPreferido = { id_item_catalogo: string; id_variacao: string | null };

export type PreferenciaFuneralResponse = {
  /** id_cliente do titular ou id_dependente. */
  id_pessoa: string;
  /** null: a família decide. */
  destino: DestinoFuneral | null;
  cerimonia: string | null;
  itens: ItemPreferido[];
  musicas: string | null;
  observacoes: string | null;
  atualizado_em: string | null;
};

export type PreferenciaFuneralRequest = Omit<
  PreferenciaFuneralResponse,
  'id_pessoa' | 'atualizado_em'
>;

export const getPreferenciasFuneralUrl = () => '/api/v1/preferencias-funeral';
export const getPreferenciasFuneralQueryKey = () => [getPreferenciasFuneralUrl()] as const;

export function usePreferenciasFuneral() {
  return useQuery({
    queryKey: getPreferenciasFuneralQueryKey(),
    queryFn: ({ signal }) =>
      requisicao<PreferenciaFuneralResponse[]>(getPreferenciasFuneralUrl(), { signal }),
  });
}

export function useSalvarPreferencias() {
  return useMutation({
    mutationFn: ({ idPessoa, dados }: { idPessoa: string; dados: PreferenciaFuneralRequest }) =>
      requisicao<PreferenciaFuneralResponse>(`${getPreferenciasFuneralUrl()}/${idPessoa}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }),
    meta: { invalida: [getPreferenciasFuneralQueryKey()] },
  });
}
