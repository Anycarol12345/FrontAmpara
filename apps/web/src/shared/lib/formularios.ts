import { ehApiError } from '@ampara/api-client';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

/** "Email", "email" e "data_nascimento" → "email" e "datanascimento", para comparar nomes de campo. */
const normalizar = (nome: string) => nome.replace(/[_\-.\s]/g, '').toLowerCase();

/**
 * Coloca os erros 400 da API nos campos do formulário (FE-06).
 * Erros sem campo correspondente (ou que não são de validação) vão para `root.servidor`.
 * `porCodigo` leva erros de regra a um campo pelo código da API (ex.: Cliente.CpfDuplicado → cpf).
 * Devolve true quando tratou o erro.
 */
export function aplicarErrosDaApi<T extends FieldValues>(
  erro: unknown,
  setError: UseFormSetError<T>,
  campos: readonly Path<T>[],
  porCodigo: Partial<Record<string, Path<T>>> = {},
): boolean {
  if (!ehApiError(erro)) return false;

  const campoDoCodigo = erro.codigo ? porCodigo[erro.codigo] : undefined;
  if (campoDoCodigo) {
    setError(campoDoCodigo, { type: 'servidor', message: erro.message });
    return true;
  }

  if (!erro.ehValidacao) {
    setError('root.servidor', { type: 'servidor', message: erro.message });
    return true;
  }

  const porNome = new Map(campos.map((campo) => [normalizar(campo), campo]));
  const semCampo: string[] = [];

  for (const [chave, mensagens] of Object.entries(erro.erros)) {
    const campo = porNome.get(normalizar(chave));
    const mensagem = mensagens[0];
    if (!mensagem) continue;
    if (campo) setError(campo, { type: 'servidor', message: mensagem });
    else semCampo.push(mensagem);
  }

  if (semCampo.length > 0) {
    setError('root.servidor', { type: 'servidor', message: semCampo.join(' ') });
  }
  return true;
}
