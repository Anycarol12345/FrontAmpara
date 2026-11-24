import { describe, expect, it } from 'vitest';
import { mascararCep, mascararCpf, mascararData, mascararTelefone } from './mascaras';

describe('máscaras', () => {
  it('cpf', () => {
    expect(mascararCpf('52998224725')).toBe('529.982.247-25');
    expect(mascararCpf('5299822')).toBe('529.982.2');
    expect(mascararCpf('529.982.247-2599')).toBe('529.982.247-25');
  });

  it('telefone fixo e celular', () => {
    expect(mascararTelefone('1133334444')).toBe('(11) 3333-4444');
    expect(mascararTelefone('11988887777')).toBe('(11) 98888-7777');
    expect(mascararTelefone('11')).toBe('(11');
    expect(mascararTelefone('119')).toBe('(11) 9');
  });

  it('cep', () => {
    expect(mascararCep('01310100')).toBe('01310-100');
    expect(mascararCep('0131')).toBe('0131');
  });

  it('data', () => {
    expect(mascararData('05102026')).toBe('05/10/2026');
    expect(mascararData('0510')).toBe('05/10');
  });
});
