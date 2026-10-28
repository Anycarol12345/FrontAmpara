import type { FormaPagamento, StatusFatura } from '../hooks/faturas';

export const STATUS_FATURA: Record<
  StatusFatura,
  { rotulo: string; variante: 'success' | 'warning' | 'info' | 'neutral' }
> = {
  PENDENTE: { rotulo: 'Em aberto', variante: 'info' },
  PROCESSANDO: { rotulo: 'Em processamento', variante: 'neutral' },
  PAGA: { rotulo: 'Paga', variante: 'success' },
  VENCIDA: { rotulo: 'Em atraso', variante: 'warning' },
  CANCELADA: { rotulo: 'Cancelada', variante: 'neutral' },
};

export const FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
  CARTAO: 'cartão',
  PIX: 'Pix',
  BOLETO: 'boleto',
  MANUAL: 'pagamento na funerária',
};

/** 2026-10 → outubro de 2026 */
export const competencia = (valor: string) => {
  const [ano, mes] = valor.split('-').map(Number);
  return new Date(ano!, (mes ?? 1) - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
};

export const podePagar = (status: StatusFatura) => status === 'PENDENTE' || status === 'VENCIDA';
