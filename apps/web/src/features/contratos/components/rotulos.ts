import type { Periodicidade, StatusContrato, TipoCobertura } from '@ampara/api-client';

export const STATUS_CONTRATO: Record<
  StatusContrato,
  { rotulo: string; variante: 'success' | 'warning' | 'info' | 'neutral' }
> = {
  ATIVO: { rotulo: 'Em dia', variante: 'success' },
  A_PAGAR: { rotulo: 'Aguardando pagamento', variante: 'warning' },
  SUSPENSO: { rotulo: 'Suspenso', variante: 'warning' },
  CANCELADO: { rotulo: 'Cancelado', variante: 'neutral' },
};

export const COBERTURA: Record<TipoCobertura, string> = {
  TITULAR: 'Só o titular',
  TITULAR_E_DEPENDENTES: 'Titular e dependentes',
  SOMENTE_DEPENDENTES: 'Só os dependentes',
};

export const PERIODICIDADE: Record<Periodicidade, { rotulo: string; sufixo: string }> = {
  MENSAL: { rotulo: 'Mensal', sufixo: '/mês' },
  ANUAL: { rotulo: 'Anual', sufixo: '/ano' },
};
