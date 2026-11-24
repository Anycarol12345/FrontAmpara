import { z } from 'zod';
import { somenteDigitos } from '@/shared/lib/mascaras';
import { UFS } from './cadastro';

const opcional = (schema: z.ZodType<string, string>) => z.union([z.literal(''), schema]);

// Campos que o cliente pode alterar (PUT /clientes/me). CPF, e-mail e nascimento não mudam por aqui.
export const meusDadosSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, 'Nome não informado.')
    .max(150, 'Nome deve ter no máximo 150 caracteres.'),
  telefone: opcional(
    z
      .string()
      .refine((t) => [10, 11].includes(somenteDigitos(t).length), 'Telefone em formato inválido.'),
  ),
  cep: opcional(
    z.string().refine((c) => somenteDigitos(c).length === 8, 'CEP em formato inválido.'),
  ),
  endereco: z.string().trim().max(200, 'Use no máximo 200 caracteres.'),
  cidade: z.string().trim().max(100, 'Use no máximo 100 caracteres.'),
  estado: z.union([z.literal(''), z.enum(UFS)]),
});

export type MeusDadosForm = z.infer<typeof meusDadosSchema>;
