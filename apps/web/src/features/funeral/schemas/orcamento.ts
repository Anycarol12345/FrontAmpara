import { z } from 'zod';

export const aprovacaoSchema = z.object({
  nome_responsavel: z.string().trim().min(1, 'Informe quem da família aprovou o orçamento.'),
});

export type AprovacaoForm = z.input<typeof aprovacaoSchema>;
export type AprovacaoValidada = z.output<typeof aprovacaoSchema>;
