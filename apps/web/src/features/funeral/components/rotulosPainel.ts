import type { Destinacao, StatusFuneral } from '@ampara/api-client';

type Variante = 'success' | 'warning' | 'info' | 'neutral';

/** Situação do funeral como a equipe vê (a família tem textos próprios em rotulos.ts). */
export const STATUS_DO_FUNERAL: Record<StatusFuneral, { rotulo: string; variante: Variante }> = {
  REGISTRADO: { rotulo: 'Registrado', variante: 'info' },
  EM_PREPARACAO: { rotulo: 'Em preparação', variante: 'warning' },
  VELORIO: { rotulo: 'Velório', variante: 'warning' },
  CONCLUIDO: { rotulo: 'Concluído', variante: 'success' },
  CANCELADO: { rotulo: 'Cancelado', variante: 'neutral' },
};

/** Texto do botão que leva o funeral para cada situação. */
export const ACAO_DE_STATUS: Record<StatusFuneral, string> = {
  REGISTRADO: 'Voltar para registrado',
  EM_PREPARACAO: 'Iniciar preparação',
  VELORIO: 'Iniciar velório',
  CONCLUIDO: 'Concluir funeral',
  CANCELADO: 'Cancelar funeral',
};

export const DESTINACAO: Record<Destinacao, string> = {
  NAO_DEFINIDA: 'A definir',
  SEPULTAMENTO: 'Sepultamento',
  CREMACAO: 'Cremação',
};

export const CLASSE_TEXTAREA =
  'min-h-24 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15';