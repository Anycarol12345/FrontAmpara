import type { PlanoResponse } from '@ampara/api-client';
import { describe, expect, it } from 'vitest';
import { cnpjValido, mascararCnpj, sugerirSlug } from '@/components/plataforma/validacao';
import { realCurto } from './formatar';
import { destaquesDoPlano } from './planos';
import { slugDoHost } from './tenant';

describe('slugDoHost', () => {
  it('lê a funerária do subdomínio, com ou sem porta', () => {
    expect(slugDoHost('demo.localhost:3000', 'localhost')).toBe('demo');
    expect(slugDoHost('sao-jose.ampara.com.br', 'ampara.com.br')).toBe('sao-jose');
  });

  it('domínio da plataforma, subdomínios reservados e outros domínios ficam sem funerária', () => {
    expect(slugDoHost('localhost:3000', 'localhost')).toBeNull();
    expect(slugDoHost('www.localhost', 'localhost')).toBeNull();
    expect(slugDoHost('a.b.localhost', 'localhost')).toBeNull();
    expect(slugDoHost('demo.outrosite.com', 'localhost')).toBeNull();
    expect(slugDoHost(null, 'localhost')).toBeNull();
  });
});

describe('cadastro de funerária', () => {
  it('valida e formata o CNPJ', () => {
    expect(cnpjValido('11.222.333/0001-81')).toBe(true);
    expect(cnpjValido('11.222.333/0001-80')).toBe(false);
    expect(cnpjValido('11111111111111')).toBe(false);
    expect(mascararCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('sugere o endereço a partir do nome', () => {
    expect(sugerirSlug('Funerária São José & Filhos')).toBe('funeraria-sao-jose-filhos');
  });
});

describe('planos', () => {
  const plano = {
    id_plano: 'p1',
    nome: 'Acolher',
    coberturas: [
      { id_plano_cobertura: 'c1', nome: 'Urna', categoria: 'Urnas', quantidade: 1 },
      { id_plano_cobertura: 'c2', nome: 'Coroa de flores', categoria: 'Flores', quantidade: 2 },
    ],
    configuracoes: { translado: { km_incluso: 300 }, cremacao_inclusa: true },
    limite_dependentes: 4,
  } as unknown as PlanoResponse;

  it('resume coberturas e configurações nos destaques do cartão', () => {
    expect(destaquesDoPlano(plano, 10)).toEqual([
      'Urna',
      'Coroa de flores (2)',
      'Translado de até 300 km',
      'Cremação inclusa',
      'Até 4 dependentes',
    ]);
    expect(destaquesDoPlano(plano)).toHaveLength(4);
  });

  it('formata valores sem centavos quando são inteiros', () => {
    expect(realCurto(39).replace(/\s/g, ' ')).toBe('R$ 39');
    expect(realCurto(39.9).replace(/\s/g, ' ')).toBe('R$ 39,90');
  });
});
