import type { StatusTerceiro, TipoTerceiro } from '@ampara/api-client';

export const TIPO_TERCEIRO: Record<TipoTerceiro, string> = {
  FROTA: 'Empresa de translado',
  CARTORIO_DESPACHANTE: 'Despachante ou cartório',
  FORNECEDOR: 'Fornecedor',
};

export const STATUS_TERCEIRO: Record<
  StatusTerceiro,
  { rotulo: string; variante: 'success' | 'warning' | 'neutral' }
> = {
  ATIVO: { rotulo: 'Ativo', variante: 'success' },
  CONVIDADO: { rotulo: 'Convite enviado', variante: 'warning' },
  INATIVO: { rotulo: 'Inativo', variante: 'neutral' },
};
