import {
  buscarContratos,
  getBuscarContratosQueryKey,
  type ContratoResumoResponse,
  type StatusContrato,
} from '@ampara/api-client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '@/features/auth';
import { numero } from '@/shared/lib/formatar';

const POR_PAGINA = 100;
// Limite de segurança: 20 páginas (2.000 contratos) bastam para os indicadores.
const MAX_PAGINAS = 20;

/**
 * Todos os contratos da funerária, do mais novo ao mais antigo (GET /gestao/contratos, página a página).
 * Base dos indicadores do consultor: o backend ainda não guarda quem vendeu cada contrato,
 * então os números são da funerária inteira.
 */
export function useTodosContratos() {
  return useQuery({
    // Mesmo prefixo da listagem: contratar um plano invalida também estes números.
    queryKey: [...getBuscarContratosQueryKey(), 'todos'],
    queryFn: async () => {
      const itens: ContratoResumoResponse[] = [];
      for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
        const resposta = await buscarContratos({
          pagina,
          tamanho: POR_PAGINA,
          ordenarPor: 'data_contratacao',
          direcao: 'desc',
        });
        itens.push(...resposta.itens);
        if (resposta.itens.length === 0 || itens.length >= numero(resposta.total)) break;
      }
      return itens;
    },
    staleTime: 60_000,
  });
}

/** "aaaa-mm" de uma data ("aaaa-mm-dd") ou de hoje. */
export const mesDe = (data?: string) =>
  data ? data.slice(0, 7) : new Date().toISOString().slice(0, 7);

/** O mês anterior a "aaaa-mm". */
export const mesAnterior = (mes: string) => {
  const [a, m] = mes.split('-').map(Number);
  const d = new Date(a!, m! - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Contratos fechados no mês (cancelados não contam como venda). */
export const vendasDoMes = (contratos: ContratoResumoResponse[], mes: string) =>
  contratos.filter((c) => mesDe(c.data_contratacao) === mes && c.status !== 'CANCELADO');

/** Quanto o contrato rende por mês: o anual é dividido por 12. */
export const valorMensal = (c: ContratoResumoResponse) =>
  c.periodicidade === 'ANUAL' ? numero(c.valor_total) / 12 : numero(c.valor_total);

/** Variação em % entre dois números; null quando não há base de comparação. */
export const variacao = (atual: number, anterior: number) =>
  anterior === 0 ? null : Math.round(((atual - anterior) / anterior) * 100);

/** Semana do mês (1 a 5) de uma data "aaaa-mm-dd". */
export const semanaDoMes = (data: string) => Math.min(5, Math.ceil(Number(data.slice(8, 10)) / 7));

export function contarPorStatus(contratos: ContratoResumoResponse[]) {
  const total: Record<StatusContrato, number> = { ATIVO: 0, A_PAGAR: 0, SUSPENSO: 0, CANCELADO: 0 };
  for (const c of contratos) total[c.status]++;
  return total;
}

/** Contrato mais recente de cada cliente (a lista já vem do mais novo ao mais antigo). */
export function contratoPorCliente(contratos: ContratoResumoResponse[]) {
  const mapa = new Map<string, ContratoResumoResponse>();
  for (const c of contratos) {
    const atual = mapa.get(c.id_cliente);
    // Um contrato em vigor vale mais que um cancelado, mesmo sendo mais antigo.
    if (!atual || (atual.status === 'CANCELADO' && c.status !== 'CANCELADO'))
      mapa.set(c.id_cliente, c);
  }
  return mapa;
}

/** Dias até o próximo aniversário do contrato (quando o plano anual renova). */
export function diasParaRenovar(dataContratacao: string, hoje = new Date()) {
  const [, m, d] = dataContratacao.slice(0, 10).split('-').map(Number);
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  let alvo = new Date(base.getFullYear(), m! - 1, d!);
  if (alvo < base) alvo = new Date(base.getFullYear() + 1, m! - 1, d!);
  return Math.round((alvo.getTime() - base.getTime()) / 86_400_000);
}

/**
 * Planos anuais em vigor que renovam nos próximos `dias` dias, do mais próximo ao mais distante:
 * a hora de o consultor falar com a família (renovar, incluir dependente, trocar de plano).
 */
export function renovacoesProximas(
  contratos: ContratoResumoResponse[],
  dias = 30,
  hoje = new Date(),
) {
  return (
    contratos
      .filter(
        (c) => c.periodicidade === 'ANUAL' && (c.status === 'ATIVO' || c.status === 'SUSPENSO'),
      )
      // Contratado neste mês ainda não renova (o "aniversário" seria a própria contratação).
      .filter((c) => mesDe(c.data_contratacao) !== mesDe(hoje.toISOString()))
      .map((c) => ({ contrato: c, dias: diasParaRenovar(c.data_contratacao, hoje) }))
      .filter((r) => r.dias <= dias)
      .sort((a, b) => a.dias - b.dias)
  );
}

const META_PADRAO = 25;

/**
 * Meta de contratos do mês do consultor. Fica no navegador de quem usa: o backend ainda não
 * tem metas. Cada usuário tem a sua.
 */
export function useMetaMensal() {
  const { usuario } = useAuth();
  const chave = `ampara:meta-mensal:${usuario?.id ?? 'anonimo'}`;
  const [meta, setMeta] = useState(() => {
    try {
      const salva = Number(localStorage.getItem(chave));
      return Number.isInteger(salva) && salva > 0 ? salva : META_PADRAO;
    } catch {
      return META_PADRAO;
    }
  });
  const salvar = (nova: number) => {
    setMeta(nova);
    try {
      localStorage.setItem(chave, String(nova));
    } catch {
      // Sem localStorage: a meta vale até recarregar a página.
    }
  };
  return { meta, salvar };
}
