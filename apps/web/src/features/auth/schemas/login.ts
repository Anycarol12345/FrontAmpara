import { z } from 'zod';

// Mensagens do AUT-02.
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'E-mail é obrigatório.')
    .pipe(z.email('E-mail em formato inválido.')),
  senha: z.string().min(1, 'Senha é obrigatória.'),
  lembrar: z.boolean(),
});

export type LoginForm = z.infer<typeof loginSchema>;

export const CAMPOS_LOGIN = ['email', 'senha'] as const;
