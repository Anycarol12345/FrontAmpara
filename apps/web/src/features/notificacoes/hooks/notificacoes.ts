import { requisicao } from '@ampara/api-client';
import { toast } from '@ampara/ui/components/sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEventoTempoReal } from '@/shared/tempo-real/contexto';

// Escrito à mão a partir do NOT-02 enquanto o backend não publica o módulo Notificacoes.
// Quando o endpoint entrar no OpenAPI, troque pelos hooks do Orval (pnpm api:generate).

export type NotificacaoResponse = {
  id_notificacao: string;
  titulo: string;
  mensagem: string;
  /** Tela do sistema relacionada (ex.: /minha-conta/faturas). */
  link: string | null;
  lida: boolean;
  criada_em: string;
};

/** Evento do hub /hubs/notificacoes a cada notificação nova (NOT-02). */
export const EVENTO_NOTIFICACAO = 'NotificacaoRecebida';

export const getNotificacoesUrl = () => '/api/v1/notificacoes';
const chave = [getNotificacoesUrl()] as const;

export function useNotificacoes() {
  return useQuery({
    queryKey: chave,
    queryFn: ({ signal }) => requisicao<NotificacaoResponse[]>(getNotificacoesUrl(), { signal }),
  });
}

/** Marca uma notificação como lida, ou todas quando não recebe o id. */
export function useMarcarComoLida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id?: string) =>
      requisicao<void>(
        id ? `${getNotificacoesUrl()}/${id}/lida` : `${getNotificacoesUrl()}/lidas`,
        {
          method: 'PATCH',
        },
      ),
    // A lista muda na hora; se a API falhar, volta como estava.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: chave });
      const anterior = queryClient.getQueryData<NotificacaoResponse[]>(chave);
      queryClient.setQueryData<NotificacaoResponse[]>(chave, (lista) =>
        lista?.map((n) => (!id || n.id_notificacao === id ? { ...n, lida: true } : n)),
      );
      return { anterior };
    },
    onError: (_erro, _id, contexto) => queryClient.setQueryData(chave, contexto?.anterior),
    onSettled: () => queryClient.invalidateQueries({ queryKey: chave }),
  });
}

/** Coloca no topo da lista as notificações que chegam pelo SignalR (FE-08). */
export function useNotificacoesTempoReal() {
  const queryClient = useQueryClient();
  useEventoTempoReal<NotificacaoResponse>(EVENTO_NOTIFICACAO, (nova) => {
    queryClient.setQueryData<NotificacaoResponse[]>(chave, (lista) => [
      nova,
      ...(lista ?? []).filter((n) => n.id_notificacao !== nova.id_notificacao),
    ]);
    toast(nova.titulo, { description: nova.mensagem });
  });
}

/** "há 5 minutos", "ontem", "12/10/2026" */
export function quando(iso: string, agora = new Date()) {
  const minutos = Math.round((agora.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  if (horas < 48) return 'ontem';
  return new Date(iso).toLocaleDateString('pt-BR');
}
