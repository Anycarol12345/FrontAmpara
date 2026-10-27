import { z } from 'zod';
import { somenteDigitos } from './mascaras';

// Schemas reutilizáveis (FE-06). As regras e mensagens espelham as validações do backend (INF-06).

export function cpfValido(valor: string) {
  const cpf = somenteDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digito = (base: string) => {
    const soma = [...base].reduce((total, n, i) => total + Number(n) * (base.length + 1 - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(cpf.slice(0, 9)) === Number(cpf[9]) && digito(cpf.slice(0, 10)) === Number(cpf[10]);
}

/** Política de senha do ASP.NET Core Identity no backend (AUT-01), também mostrada ao digitar. */
export const REGRAS_SENHA = [
  {
    rotulo: '8 caracteres ou mais',
    mensagem: 'A senha precisa ter pelo menos 8 caracteres.',
    teste: (senha: string) => senha.length >= 8,
  },
  {
    rotulo: 'Uma letra minúscula',
    mensagem: 'A senha precisa ter uma letra minúscula.',
    teste: (senha: string) => /[a-z]/.test(senha),
  },
  {
    rotulo: 'Uma letra maiúscula',
    mensagem: 'A senha precisa ter uma letra maiúscula.',
    teste: (senha: string) => /[A-Z]/.test(senha),
  },
  {
    rotulo: 'Um número',
    mensagem: 'A senha precisa ter um número.',
    teste: (senha: string) => /\d/.test(senha),
  },
  {
    rotulo: 'Um símbolo (ex.: @, #, !)',
    mensagem: 'A senha precisa ter um símbolo (ex.: @, #, !).',
    teste: (senha: string) => /[^A-Za-z0-9]/.test(senha),
  },
];

const obrigatorio = (mensagem: string) => z.string().trim().min(1, mensagem);

export const esquemas = {
  nome: obrigatorio('Nome é obrigatório.').max(150, 'Use no máximo 150 caracteres.'),

  email: obrigatorio('E-mail é obrigatório.').pipe(z.email('E-mail em formato inválido.')),

  cpf: obrigatorio('CPF não informado ou em formato inválido.').refine(
    cpfValido,
    'CPF não informado ou em formato inválido.',
  ),

  telefone: obrigatorio('Telefone é obrigatório.').refine((valor) => {
    const digitos = somenteDigitos(valor);
    return digitos.length === 10 || digitos.length === 11;
  }, 'Telefone em formato inválido.'),

  cep: obrigatorio('CEP é obrigatório.').refine(
    (valor) => somenteDigitos(valor).length === 8,
    'CEP em formato inválido.',
  ),

  // Mesma política do ASP.NET Core Identity no backend (AUT-01).
  senha: z.string().superRefine((senha, contexto) => {
    const falha = REGRAS_SENHA.find((regra) => !regra.teste(senha));
    if (falha) contexto.addIssue({ code: 'custom', message: falha.mensagem });
  }),

  /** dd/mm/aaaa, convertida para aaaa-mm-dd (formato da API). */
  data: obrigatorio('Data é obrigatória.')
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Use o formato dd/mm/aaaa.')
    .transform((valor) => valor.split('/').reverse().join('-'))
    .refine((iso) => {
      const data = new Date(`${iso}T00:00:00Z`);
      return !Number.isNaN(data.getTime()) && data.toISOString().startsWith(iso);
    }, 'Data inválida.'),
};
