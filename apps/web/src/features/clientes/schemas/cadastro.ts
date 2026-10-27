import { z } from 'zod';
import { esquemas } from '@/shared/lib/validacao';

export const cadastroSchema = z
  .object({
    nome: esquemas.nome,
    email: esquemas.email,
    cpf: esquemas.cpf,
    celular: esquemas.telefone,
    senha: esquemas.senha,
    confirmacao: z.string().min(1, 'Confirme sua senha.'),
    termos: z.boolean().refine(Boolean, 'Aceite os termos para continuar.'),
  })
  .refine((dados) => dados.senha === dados.confirmacao, {
    path: ['confirmacao'],
    message: 'As senhas não conferem.',
  });

export type CadastroForm = z.input<typeof cadastroSchema>;
