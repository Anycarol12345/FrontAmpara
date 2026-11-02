import { requisicao, type FuneralResumoResponse } from '@ampara/api-client';
import { useQuery } from '@tanstack/react-query';

export type {
  FuneralResponse,
  FuneralResumoResponse,
  StatusCertidao,
  StatusFuneral,
  StatusTranslado,
} from '@ampara/api-client';

export type EtapaHistorico<S> = { status: S; data_hora: string; observacao: string | null };

// O backend ainda não lista os funerais da família (só o detalhe, em GET /funerais/{id}).
// Quando publicar a listagem do titular, troque por ela (pnpm api:generate) e apague esta.
export const getFuneraisDaFamiliaUrl = () => '/api/v1/funerais';

/** Funerais dos beneficiários dos contratos do titular. Sem a rota no backend, a lista fica vazia. */
export function useFuneraisDaFamilia() {
  return useQuery({
    queryKey: [getFuneraisDaFamiliaUrl(), 'familia'],
    queryFn: ({ signal }) =>
      requisicao<FuneralResumoResponse[]>(getFuneraisDaFamiliaUrl(), { signal }),
    meta: { silenciarErro: true },
    retry: false,
  });
}
