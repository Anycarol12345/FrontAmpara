import { describe, expect, it } from 'vitest';
import { cpfValido, esquemas } from './validacao';

const mensagem = (resultado: { success: boolean; error?: { issues: { message: string }[] } }) =>
  resultado.success ? null : resultado.error?.issues[0]?.message;

describe('cpfValido', () => {
  it.each(['529.982.247-25', '52998224725', '111.444.777-35'])('aceita %s', (cpf) => {
    expect(cpfValido(cpf)).toBe(true);
  });

  it.each(['529.982.247-24', '111.111.111-11', '123', ''])('recusa %s', (cpf) => {
    expect(cpfValido(cpf)).toBe(false);
  });
});

describe('esquemas', () => {
  it('cpf usa a mensagem do backend', () => {
    expect(mensagem(esquemas.cpf.safeParse('123.456.789-00'))).toBe(
      'CPF não informado ou em formato inválido.',
    );
  });

  it('telefone aceita fixo e celular com DDD', () => {
    expect(esquemas.telefone.safeParse('(11) 3333-4444').success).toBe(true);
    expect(esquemas.telefone.safeParse('(11) 98888-7777').success).toBe(true);
    expect(esquemas.telefone.safeParse('98888-7777').success).toBe(false);
  });

  it('cep exige 8 dígitos', () => {
    expect(esquemas.cep.safeParse('01310-100').success).toBe(true);
    expect(esquemas.cep.safeParse('0131-010').success).toBe(false);
  });

  it('e-mail obrigatório e em formato válido', () => {
    expect(mensagem(esquemas.email.safeParse(''))).toBe('E-mail é obrigatório.');
    expect(mensagem(esquemas.email.safeParse('ana@'))).toBe('E-mail em formato inválido.');
    expect(esquemas.email.safeParse('ana@demo.localhost').success).toBe(true);
  });

  it('senha segue a política do Identity', () => {
    expect(esquemas.senha.safeParse('Senha@123').success).toBe(true);
    expect(mensagem(esquemas.senha.safeParse('Se@1'))).toBe(
      'A senha precisa ter pelo menos 8 caracteres.',
    );
    expect(mensagem(esquemas.senha.safeParse('senha@123'))).toBe(
      'A senha precisa ter uma letra maiúscula.',
    );
    expect(mensagem(esquemas.senha.safeParse('Senha1234'))).toBe(
      'A senha precisa ter um símbolo (ex.: @, #, !).',
    );
  });

  it('data converte dd/mm/aaaa para o formato da API e recusa datas que não existem', () => {
    expect(esquemas.data.parse('05/10/2026')).toBe('2026-10-05');
    expect(mensagem(esquemas.data.safeParse('31/02/2026'))).toBe('Data inválida.');
    expect(mensagem(esquemas.data.safeParse('2026-10-05'))).toBe('Use o formato dd/mm/aaaa.');
  });
});
