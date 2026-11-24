import { describe, expect, it } from 'vitest';
import { validarFaixas } from './faixas';

const faixa = (de_km: string, ate_km: string, valor = '100', valor_km_excedente = '') => ({
  de_km,
  ate_km,
  valor,
  valor_km_excedente,
});

describe('validarFaixas', () => {
  it('aceita faixas contínuas com a última sem fim', () => {
    expect(validarFaixas([faixa('0', '50'), faixa('50', '', '300', '4.5')])).toEqual({
      faixas: [
        { de_km: 0, ate_km: 50, valor: 100, valor_km_excedente: null },
        { de_km: 50, ate_km: null, valor: 300, valor_km_excedente: 4.5 },
      ],
    });
  });

  it('recusa faixas sobrepostas', () => {
    expect(validarFaixas([faixa('0', '50'), faixa('40', '100')])).toEqual({
      erro: 'As faixas 1 e 2 se sobrepõem: a faixa 2 começa antes de 50 km.',
    });
  });

  it('recusa vão entre faixas e faixa sem fim no meio', () => {
    expect(validarFaixas([faixa('0', '50'), faixa('60', '100')])).toHaveProperty('erro');
    expect(validarFaixas([faixa('0', ''), faixa('50', '100')])).toEqual({
      erro: 'Faixa 1: só a última faixa pode ficar sem km final.',
    });
  });
});
