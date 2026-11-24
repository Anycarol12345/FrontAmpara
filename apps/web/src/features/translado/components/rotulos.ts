import type { StatusAceite, StatusTranslado } from '@ampara/api-client';

type Variante = 'success' | 'warning' | 'info' | 'neutral';

export const STATUS_TRANSLADO: Record<StatusTranslado, { rotulo: string; variante: Variante }> = {
  AGENDADO: { rotulo: 'Agendado', variante: 'info' },
  EM_COLETA: { rotulo: 'Em coleta', variante: 'warning' },
  EM_TRANSITO: { rotulo: 'Em trânsito', variante: 'warning' },
  ENTREGUE: { rotulo: 'Entregue', variante: 'success' },
  CANCELADO: { rotulo: 'Cancelado', variante: 'neutral' },
};

/** Para onde cada situação pode ir (TRA-06). Cancelar fica à parte, com confirmação. */
export const PROXIMO_STATUS: Partial<
  Record<StatusTranslado, { para: StatusTranslado; acao: string }>
> = {
  AGENDADO: { para: 'EM_COLETA', acao: 'Registrar coleta' },
  EM_COLETA: { para: 'EM_TRANSITO', acao: 'Saiu para o destino' },
  EM_TRANSITO: { para: 'ENTREGUE', acao: 'Registrar entrega' },
};

export const ACEITE: Record<NonNullable<StatusAceite>, { rotulo: string; variante: Variante }> = {
  PENDENTE: { rotulo: 'Aguardando aceite', variante: 'warning' },
  ACEITO: { rotulo: 'Aceito', variante: 'success' },
  RECUSADO: { rotulo: 'Recusado', variante: 'neutral' },
};

export const encerrado = (status: StatusTranslado) =>
  status === 'ENTREGUE' || status === 'CANCELADO';
