import { z } from 'zod';
import { SUBDOMINIOS_RESERVADOS } from '@/lib/tenant';

export const somenteDigitos = (valor: string) => valor.replace(/\D/g, '');

/** 00.000.000/0000-00 */
export const mascararCnpj = (valor: string) =>
  somenteDigitos(valor)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');

/** (00) 0000-0000 ou (00) 00000-0000 */
export function mascararTelefone(valor: string) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.replace(/(\d{1,2})/, '($1');
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (_, a, b, c) =>
      c ? `(${a}) ${b}-${c}` : `(${a}) ${b}`,
    );
  return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

export function cnpjValido(valor: string) {
  const cnpj = somenteDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const digito = (base: string) => {
    const pesos =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const resto = [...base].reduce((soma, n, i) => soma + Number(n) * pesos[i]!, 0) % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return (
    digito(cnpj.slice(0, 12)) === Number(cnpj[12]) && digito(cnpj.slice(0, 13)) === Number(cnpj[13])
  );
}

// Mesmas regras e mensagens do backend (CadastrarFunerariaCommandValidator, TEN-02).
export const SLUG_VALIDO = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/;

/** Sugere o endereço a partir do nome: "Funerária São José" → "funeraria-sao-jose". */
export const sugerirSlug = (nome: string) =>
  nome
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);

const email = z
  .string()
  .trim()
  .min(1, 'E-mail é obrigatório.')
  .pipe(z.email('E-mail em formato inválido.'));

export const cadastroFunerariaSchema = z.object({
  nomeFantasia: z
    .string()
    .trim()
    .min(1, 'Nome fantasia é obrigatório.')
    .max(150, 'Nome fantasia deve ter no máximo 150 caracteres.'),
  razaoSocial: z
    .string()
    .trim()
    .min(1, 'Razão social é obrigatória.')
    .max(150, 'Razão social deve ter no máximo 150 caracteres.'),
  cnpj: z.string().refine(cnpjValido, 'CNPJ não informado ou em formato inválido.'),
  emailContato: email,
  telefone: z
    .string()
    .refine((t) => [10, 11].includes(somenteDigitos(t).length), 'Telefone em formato inválido.'),
  slug: z
    .string()
    .trim()
    .min(1, 'Endereço (slug) é obrigatório.')
    .regex(
      SLUG_VALIDO,
      'Endereço deve ter de 3 a 63 caracteres: letras minúsculas, números e hífen, sem começar ou terminar com hífen.',
    )
    .refine(
      (s) => !SUBDOMINIOS_RESERVADOS.has(s),
      'Este endereço é reservado pela plataforma. Escolha outro.',
    ),
  gestorNome: z
    .string()
    .trim()
    .min(1, 'Nome do gestor é obrigatório.')
    .max(150, 'Nome do gestor deve ter no máximo 150 caracteres.'),
  gestorEmail: email,
  termos: z.boolean().refine(Boolean, 'Aceite os termos para continuar.'),
});

export type CadastroFunerariaForm = z.infer<typeof cadastroFunerariaSchema>;

/** Campos de cada etapa, validados antes de avançar. */
export const ETAPAS = [
  {
    titulo: 'Empresa',
    campos: ['nomeFantasia', 'razaoSocial', 'cnpj', 'emailContato', 'telefone'],
  },
  { titulo: 'Endereço', campos: ['slug'] },
  { titulo: 'Gestor', campos: ['gestorNome', 'gestorEmail', 'termos'] },
] as const satisfies { titulo: string; campos: (keyof CadastroFunerariaForm)[] }[];
