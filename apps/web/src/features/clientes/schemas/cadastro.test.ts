import { describe, expect, it } from 'vitest';
import { cadastroSchema, type CadastroForm } from './cadastro';

const valido: CadastroForm = {
  nome: 'Mariana Lima',
  cpf: '529.982.247-25',
  dataNascimento: '12/05/1980',
  celular: '(11) 98888-7777',
  cep: '01310-100',
  endereco: 'Av. Paulista, 1000',
  cidade: 'São Paulo',
  estado: 'SP',
  email: 'mariana@email.com',
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
  it('aceita um cadastro completo e converte a data para o formato da API', () => {
    expect(errosDe(valido)).toEqual({});
    expect(cadastroSchema.parse(valido).dataNascimento).toBe('1980-05-12');
  });

  it('recusa data de nascimento no futuro', () => {
    expect(errosDe({ ...valido, dataNascimento: '01/01/2999' })).toEqual({
      dataNascimento: 'Data de nascimento inválida.',
    });
  });

  it('exige que as senhas confiram', () => {
    expect(errosDe({ ...valido, confirmacao: 'Outra@123' })).toEqual({
      confirmacao: 'As senhas não conferem.',
    });
  });

  it('exige o aceite dos termos e uma UF válida', () => {
    expect(errosDe({ ...valido, termos: false, estado: '' as CadastroForm['estado'] })).toEqual({
      termos: 'Aceite os termos para continuar.',
      estado: 'Escolha o estado.',
    });
  });
});
