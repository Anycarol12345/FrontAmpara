import { z } from 'zod';

export const OPCOES_BAIXA = [
  { valor: 'MANUAL', rotulo: 'Dinheiro ou pagamento na funerária' },
  { valor: 'PIX', rotulo: 'Pix' },
  { valor: 'BOLETO', rotulo: 'Boleto' },
  { valor: 'CARTAO', rotulo: 'Cartão' },
] as const;

export const baixaManualSchema = z.object({
  forma_pagamento: z.enum(['MANUAL', 'PIX', 'BOLETO', 'CARTAO'], {
    error: 'Escolha a forma de pagamento.',
  }),
  observacao: z.string().trim().min(1, 'Informe uma observação (ex.: número do recibo).'),
});

export type BaixaManualForm = z.input<typeof baixaManualSchema>;
export type BaixaManualValidada = z.output<typeof baixaManualSchema>;
