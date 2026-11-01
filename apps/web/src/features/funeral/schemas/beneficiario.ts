import { z } from 'zod';

export const dataDeHoje = () => new Date().toLocaleDateString('sv-SE');

export const falecimentoSchema = z.object({
  data_falecimento: z
    .string()
    .min(1, 'Informe a data do falecimento.')
    .refine((valor) => valor <= dataDeHoje(), 'A data não pode ser no futuro.'),
  local_falecimento: z.string().trim().min(1, 'Informe o local do falecimento.'),
  responsavel_nome: z.string().trim().min(1, 'Informe o nome do responsável.'),
  responsavel_telefone: z
    .string()
    .refine((valor) => valor.replace(/\D/g, '').length >= 10, 'Informe o telefone com DDD.'),
  responsavel_parentesco: z.string().trim().min(1, 'Informe o parentesco com o falecido.'),
});

export type FalecimentoForm = z.input<typeof falecimentoSchema>;
export type FalecimentoValidado = z.output<typeof falecimentoSchema>;
