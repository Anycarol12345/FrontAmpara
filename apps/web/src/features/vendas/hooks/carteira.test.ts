import type { ContratoResumoResponse } from '@ampara/api-client';
import { describe, expect, it } from 'vitest';
import {
  contarPorStatus,
  contratoPorCliente,
  mesAnterior,
  renovacoesProximas,
  semanaDoMes,
  valorMensal,
  variacao,
  vendasDoMes,
} from './carteira';

const contrato = (parcial: Partial<ContratoResumoResponse>): ContratoResumoResponse => ({
  id_contrato: 'c1',
  id_cliente: 'cl1',
  nome_titular: 'Ana',
  id_plano: 'p1',
  nome_plano: 'Acolher',
  tipo_cobertura: 'TITULAR',
  periodicidade: 'MENSAL',
  status: 'ATIVO',
  valor_total: 69.9,
  data_contratacao: '2026-11-05',
  quantidade_pessoas: 1,
  ...parcial,
});

describe('indicadores da carteira', () => {
  it('conta só as vendas do mês que não foram canceladas', () => {
    const lista = [
      contrato({ id_contrato: 'a' }),
      contrato({ id_contrato: 'b', status: 'CANCELADO' }),
      contrato({ id_contrato: 'c', data_contratacao: '2026-10-30' }),
    ];
    expect(vendasDoMes(lista, '2026-11').map((c) => c.id_contrato)).toEqual(['a']);
  });

  it('volta um mês, inclusive na virada do ano', () => {
    expect(mesAnterior('2026-11')).toBe('2026-10');
    expect(mesAnterior('2026-01')).toBe('2025-12');
  });

  it('divide o plano anual por 12 para comparar com o mensal', () => {
    expect(valorMensal(contrato({ periodicidade: 'ANUAL', valor_total: 1200 }))).toBe(100);
    expect(valorMensal(contrato({ valor_total: 39.9 }))).toBe(39.9);
  });

  it('calcula a variação e não divide por zero', () => {
    expect(variacao(12, 10)).toBe(20);
    expect(variacao(3, 0)).toBeNull();
  });

  it('põe o dia na semana do mês', () => {
    expect(semanaDoMes('2026-11-01')).toBe(1);
    expect(semanaDoMes('2026-11-08')).toBe(2);
    expect(semanaDoMes('2026-11-31')).toBe(5);
  });

  it('lista os planos anuais que renovam nos próximos 30 dias, do mais próximo', () => {
    const hoje = new Date(2026, 10, 23);
    const lista = [
      contrato({ id_contrato: 'longe', periodicidade: 'ANUAL', data_contratacao: '2025-12-20' }),
      contrato({ id_contrato: 'perto', periodicidade: 'ANUAL', data_contratacao: '2025-11-30' }),
      contrato({ id_contrato: 'mensal', data_contratacao: '2025-11-25' }),
      contrato({
        id_contrato: 'cancelado',
        periodicidade: 'ANUAL',
        status: 'CANCELADO',
        data_contratacao: '2025-11-26',
      }),
      contrato({ id_contrato: 'fora', periodicidade: 'ANUAL', data_contratacao: '2025-02-10' }),
      contrato({ id_contrato: 'novo', periodicidade: 'ANUAL', data_contratacao: '2026-11-20' }),
    ];
    expect(
      renovacoesProximas(lista, 30, hoje).map((r) => [r.contrato.id_contrato, r.dias]),
    ).toEqual([
      ['perto', 7],
      ['longe', 27],
    ]);
  });

  it('usa o contrato em vigor de cada cliente, mesmo que um cancelado seja mais novo', () => {
    const lista = [
      contrato({ id_contrato: 'novo', status: 'CANCELADO', data_contratacao: '2026-11-10' }),
      contrato({ id_contrato: 'antigo', status: 'SUSPENSO', data_contratacao: '2025-01-10' }),
      contrato({ id_contrato: 'outro', id_cliente: 'cl2', status: 'A_PAGAR' }),
    ];
    const mapa = contratoPorCliente(lista);
    expect(mapa.get('cl1')?.id_contrato).toBe('antigo');
    expect(contarPorStatus([...mapa.values()])).toEqual({
      ATIVO: 0,
      A_PAGAR: 1,
      SUSPENSO: 1,
      CANCELADO: 0,
    });
  });
});
