import { ApiError } from '@ampara/api-client';
import { describe, expect, it, vi } from 'vitest';
import { aplicarErrosDaApi } from './formularios';

type Form = { email: string; dataNascimento: string };
const CAMPOS = ['email', 'dataNascimento'] as const;

describe('aplicarErrosDaApi', () => {
  it('coloca cada erro 400 no campo correspondente, aceitando snake_case e maiúsculas', () => {
    const setError = vi.fn();
    const erro = new ApiError(400, {
      errors: { Email: ['E-mail já cadastrado.'], data_nascimento: ['Data inválida.'] },
    });

    expect(aplicarErrosDaApi<Form>(erro, setError, CAMPOS)).toBe(true);
    expect(setError).toHaveBeenCalledWith('email', {
      type: 'servidor',
      message: 'E-mail já cadastrado.',
    });
    expect(setError).toHaveBeenCalledWith('dataNascimento', {
      type: 'servidor',
      message: 'Data inválida.',
    });
  });

  it('erros sem campo no formulário vão para root.servidor', () => {
    const setError = vi.fn();
    const erro = new ApiError(400, { errors: { plano: ['Plano inativo.'] } });

    aplicarErrosDaApi<Form>(erro, setError, CAMPOS);

    expect(setError).toHaveBeenCalledWith('root.servidor', {
      type: 'servidor',
      message: 'Plano inativo.',
    });
  });

  it('erros que não são de validação mostram o detail', () => {
    const setError = vi.fn();
    aplicarErrosDaApi<Form>(
      new ApiError(401, { detail: 'E-mail ou senha inválidos.' }),
      setError,
      CAMPOS,
    );

    expect(setError).toHaveBeenCalledWith('root.servidor', {
      type: 'servidor',
      message: 'E-mail ou senha inválidos.',
    });
  });

  it('ignora erros que não vieram da API', () => {
    expect(aplicarErrosDaApi<Form>(new Error('outro'), vi.fn(), CAMPOS)).toBe(false);
  });
});
