import { z } from 'zod';
import { esquemas } from '@/shared/lib/validacao';

// PUT /auth/senha (AUT-06). Os nomes seguem a API para os erros 400 caírem no campo certo.
export const alterarSenhaSchema = z
  .object({
    senha_atual: z.string().min(1, 'Informe a senha atual.'),
    nova_senha: esquemas.senha,
    confirmacao: z.string(),
  })
  .refine((dados) => dados.nova_senha === dados.confirmacao, {
    path: ['confirmacao'],
    message: 'As senhas não conferem.',
  })
  .refine((dados) => dados.nova_senha !== dados.senha_atual, {
    path: ['nova_senha'],
    message: 'A nova senha precisa ser diferente da atual.',
  });

export type AlterarSenhaForm = z.infer<typeof alterarSenhaSchema>;
