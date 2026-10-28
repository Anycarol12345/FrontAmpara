import { z } from 'zod';
import { somenteDigitos } from '@/shared/lib/mascaras';
import { esquemas } from '@/shared/lib/validacao';

/** O backend aceita texto livre (até 50 caracteres); oferecemos os mais comuns. */
export const PARENTESCOS = [
  'Cônjuge',
  'Filho(a)',
  'Pai',
  'Mãe',
  'Irmão(ã)',
  'Avô/Avó',
  'Neto(a)',
  'Sogro(a)',
  'Outro',
] as const;

const opcional = (schema: z.ZodType<string, string>) => z.union([z.literal(''), schema]);

export const dependenteSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, 'Nome não informado.')
    .max(150, 'Nome deve ter no máximo 150 caracteres.'),
  cpf: esquemas.cpf,
  dataNascimento: esquemas.data,
  parentesco: z
    .string()
    .trim()
    .min(1, 'Informe o parentesco.')
    .max(50, 'Use no máximo 50 caracteres.'),
  telefone: opcional(
    z
      .string()
      .refine((t) => [10, 11].includes(somenteDigitos(t).length), 'Telefone em formato inválido.'),
  ),
  email: opcional(z.email('E-mail em formato inválido.')),
});

export type DependenteForm = z.input<typeof dependenteSchema>;
export type DependenteValidado = z.output<typeof dependenteSchema>;
