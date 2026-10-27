import { describe, expect, it } from 'vitest';
import { cadastroSchema, type CadastroForm } from './cadastro';

const valido: CadastroForm = {
  nome: 'Mariana Lima',
  email: 'mariana@email.com',
  cpf: '529.982.247-25',
  celular: '(11) 98888-7777',
  senha: 'Senha@123',
  confirmacao: 'Senha@123',
  termos: true,
};

const errosDe = (dados: CadastroForm) => {
  const resultado = cadastroSchema.safeParse(dados);
  return resultado.success
    ? {}
    : Object.fromEntries(resultado.error.issues.map((i) => [i.path.join('.'), i.message]));
};

describe('cadastroSchema', () => {
  it('aceita um cadastro completo', () => {
    expect(errosDe(valido)).toEqual({});
  });

  it('exige que as senhas confiram', () => {
    expect(errosDe({ ...valido, confirmacao: 'Outra@123' })).toEqual({
      confirmacao: 'As senhas não conferem.',
    });
  });

  it('exige o aceite dos termos', () => {
    expect(errosDe({ ...valido, termos: false })).toEqual({
      termos: 'Aceite os termos para continuar.',
    });
  });
});
