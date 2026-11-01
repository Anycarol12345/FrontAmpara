import { z } from 'zod';

export const OPCOES_DESTINACAO = [
  { valor: 'NAO_DEFINIDA', rotulo: 'A definir' },
  { valor: 'SEPULTAMENTO', rotulo: 'Sepultamento' },
  { valor: 'CREMACAO', rotulo: 'Cremação' },
] as const;

export const funeralSchema = z.object({
  data_hora_prevista: z.string().min(1, 'Informe a data e a hora previstas.'),
  destinacao: z.enum(['NAO_DEFINIDA', 'SEPULTAMENTO', 'CREMACAO'], {
    error: 'Escolha a destinação.',
  }),
  observacoes: z.string().trim(),
});

export type FuneralForm = z.input<typeof funeralSchema>;
export type FuneralValidado = z.output<typeof funeralSchema>;

/** Cancelar exige o motivo; as demais mudanças aceitam observação opcional. */
export const statusSchema = (exigirMotivo: boolean) =>
  z.object({
    observacao: exigirMotivo
      ? z.string().trim().min(1, 'Informe o motivo do cancelamento.')
      : z.string().trim(),
  });

export type StatusForm = z.input<ReturnType<typeof statusSchema>>;
export type StatusValidado = z.output<ReturnType<typeof statusSchema>>;