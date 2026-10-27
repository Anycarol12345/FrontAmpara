import { z } from 'zod';
import { esquemas } from '@/shared/lib/validacao';

export const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

// Mensagens iguais às do backend (CadastrarClienteCommandValidator).
export const cadastroSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(1, 'Nome não informado.')
      .max(150, 'Nome deve ter no máximo 150 caracteres.'),
    cpf: esquemas.cpf,
    dataNascimento: esquemas.data.refine((iso) => {
      const data = new Date(`${iso}T00:00:00Z`);
      const hoje = new Date();
      const limite = new Date(
        Date.UTC(hoje.getUTCFullYear() - 130, hoje.getUTCMonth(), hoje.getUTCDate()),
      );
      return data <= hoje && data >= limite;
    }, 'Data de nascimento inválida.'),
    celular: esquemas.telefone,
    cep: esquemas.cep,
    endereco: z
      .string()
      .trim()
      .min(1, 'Endereço é obrigatório.')
      .max(200, 'Use no máximo 200 caracteres.'),
    cidade: z
      .string()
      .trim()
      .min(1, 'Cidade é obrigatória.')
      .max(100, 'Use no máximo 100 caracteres.'),
    estado: z.enum(UFS, 'Escolha o estado.'),
    email: esquemas.email,
    senha: esquemas.senha,
    confirmacao: z.string().min(1, 'Confirme sua senha.'),
    termos: z.boolean().refine(Boolean, 'Aceite os termos para continuar.'),
  })
  .refine((dados) => dados.senha === dados.confirmacao, {
    path: ['confirmacao'],
    message: 'As senhas não conferem.',
  });

export type CadastroForm = z.input<typeof cadastroSchema>;
export type CadastroValidado = z.output<typeof cadastroSchema>;

/** Etapas do cadastro (FE-PUB-02): cada uma é validada antes de avançar. */
export const ETAPAS_CADASTRO = [
  { titulo: 'Você', campos: ['nome', 'cpf', 'dataNascimento', 'celular'] },
  { titulo: 'Endereço', campos: ['cep', 'endereco', 'cidade', 'estado'] },
  { titulo: 'Acesso', campos: ['email', 'senha', 'confirmacao', 'termos'] },
] as const satisfies { titulo: string; campos: (keyof CadastroForm)[] }[];

export const CAMPOS_CADASTRO = ETAPAS_CADASTRO.flatMap((etapa) => etapa.campos);
