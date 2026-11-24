import {
  getMinhasNotificacoesQueryKey,
  marcarNotificacaoLida,
  marcarTodasLidas,
  useMinhasNotificacoes,
  type NotificacaoResponse,
  type NotificacoesResponse,
} from '@ampara/api-client';
import { toast } from '@ampara/ui/components/sonner';
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEventoTempoReal } from '@/shared/tempo-real/contexto';

export type { NotificacaoResponse } from '@ampara/api-client';

/** Evento do hub /hubs/notificacoes a cada notificação nova (NOT-02, NotificacoesHub.Evento). */
export const EVENTO_NOTIFICACAO = 'notificacao';

const PARAMETROS = { pagina: 1, tamanho: 20 };
const chave = (): QueryKey => getMinhasNotificacoesQueryKey(PARAMETROS);

export const foiLida = (n: NotificacaoResponse) => n.lida_em !== null;

/** As 20 notificações mais recentes e quantas ainda não foram lidas (GET /notificacoes). */
export function useNotificacoes() {
  return useMinhasNotificacoes(PARAMETROS);
}

/** Marca uma notificação como lida, ou todas quando não recebe o id. */
export function useMarcarComoLida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id?: string) => (id ? marcarNotificacaoLida(id) : marcarTodasLidas()),
    // A lista muda na hora; se a API falhar, volta como estava.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: chave() });
      const anterior = queryClient.getQueryData<NotificacoesResponse>(chave());
      const agora = new Date().toISOString();
      queryClient.setQueryData<NotificacoesResponse>(chave(), (pagina) => {
        if (!pagina) return pagina;
        const itens = pagina.itens.map((n) =>
          !foiLida(n) && (!id || n.id_notificacao === id) ? { ...n, lida_em: agora } : n,
        );
        return { ...pagina, itens, nao_lidas: id ? Math.max(0, pagina.nao_lidas - 1) : 0 };
      });
      return { anterior };
    },
    onError: (_erro, _id, contexto) => queryClient.setQueryData(chave(), contexto?.anterior),
    onSettled: () => queryClient.invalidateQueries({ queryKey: chave() }),
  });
}

/** Coloca no topo da lista as notificações que chegam pelo SignalR (FE-08). */
export function useNotificacoesTempoReal() {
  const queryClient = useQueryClient();
  useEventoTempoReal<NotificacaoResponse>(EVENTO_NOTIFICACAO, (nova) => {
    queryClient.setQueryData<NotificacoesResponse>(chave(), (pagina) =>
      pagina
        ? {
            ...pagina,
            itens: [nova, ...pagina.itens.filter((n) => n.id_notificacao !== nova.id_notificacao)],
            total: pagina.total + 1,
            nao_lidas: pagina.nao_lidas + 1,
          }
        : pagina,
    );
    toast(nova.titulo, { description: nova.mensagem });
  });
}

/**
 * O backend aponta para o recurso (/contratos/{id}, /faturas/{id}, /funerais/{id});
 * aqui ele vira a tela da área do cliente.
 */
export function linkDoCliente(link: string | null) {
  if (!link) return null;
  const [, recurso, id] = link.split('/');
  if (recurso === 'contratos' && id) return `/minha-conta/contratos/${id}`;
  if (recurso === 'faturas') return '/minha-conta/faturas';
  if (recurso === 'funerais' && id) return `/minha-conta/atendimentos/${id}`;
  return link.startsWith('/minha-conta') ? link : null;
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
