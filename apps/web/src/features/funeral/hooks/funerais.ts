import { requisicao } from '@ampara/api-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTransladoTempoReal, type TransladoStatusAlterado } from '@/features/translado';

// Escrito à mão a partir do FUN-07, TRA-05 e CER-04 enquanto o backend não publica o módulo Funeral.
// Quando o endpoint entrar no OpenAPI, troque pelos hooks do Orval (pnpm api:generate).

export type StatusFuneral = 'REGISTRADO' | 'EM_PREPARACAO' | 'VELORIO' | 'CONCLUIDO' | 'CANCELADO';
export type StatusTranslado = TransladoStatusAlterado['status'];
export type StatusCertidao = 'SOLICITADA' | 'EM_ANDAMENTO' | 'EMITIDA';

export type EtapaHistorico<S> = { status: S; data_hora: string; observacao: string | null };

export type FuneralResumoResponse = {
  id_funeral: string;
  nome_falecido: string;
  data_falecimento: string;
  status: StatusFuneral;
};

export type FuneralResponse = FuneralResumoResponse & {
  historico: EtapaHistorico<StatusFuneral>[];
  velorio: {
    local: string;
    endereco: string;
    sala: string | null;
    inicio: string;
    fim: string;
  } | null;
  despedida: {
    tipo: 'SEPULTAMENTO' | 'CREMACAO';
    local: string;
    endereco: string;
    data_hora: string;
  } | null;
  itens: { nome: string; categoria: string; quantidade: number; coberto: boolean }[];
  translado: {
    id_translado: string;
    status: StatusTranslado;
    origem: string;
    destino: string;
    historico: EtapaHistorico<StatusTranslado>[];
  } | null;
  certidao: { status: StatusCertidao; numero_matricula: string | null; url: string | null } | null;
  documentos: { id_documento: string; nome: string; url: string }[];
  responsavel: { nome: string; telefone: string | null } | null;
};

export const getFuneraisUrl = () => '/api/v1/funerais';
const chaveLista = [getFuneraisUrl()] as const;
const chaveDetalhe = (id: string) => [`${getFuneraisUrl()}/${id}`] as const;

/** Funerais dos beneficiários dos contratos do titular. */
export function useMeusFunerais() {
  return useQuery({
    queryKey: chaveLista,
    queryFn: ({ signal }) => requisicao<FuneralResumoResponse[]>(getFuneraisUrl(), { signal }),
    meta: { silenciarErro: true },
  });
}

/** Detalhe do funeral (GET /funerais/{id}), atualizado quando o translado muda (TRA-06). */
export function useFuneral(id: string) {
  const queryClient = useQueryClient();
  const consulta = useQuery({
    queryKey: chaveDetalhe(id),
    queryFn: ({ signal }) => requisicao<FuneralResponse>(`${getFuneraisUrl()}/${id}`, { signal }),
  });

  useTransladoTempoReal(consulta.data?.translado?.id_translado, (evento) => {
    queryClient.setQueryData<FuneralResponse>(chaveDetalhe(id), (funeral) =>
      funeral?.translado
        ? {
            ...funeral,
            translado: {
              ...funeral.translado,
              status: evento.status,
              historico: [
                ...funeral.translado.historico,
                { status: evento.status, data_hora: evento.alterado_em, observacao: null },
              ],
            },
          }
        : funeral,
    );
  });

  return consulta;
}
