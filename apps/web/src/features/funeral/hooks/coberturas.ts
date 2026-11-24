import {
  getObterContratoQueryOptions,
  getObterPlanoQueryOptions,
  useMeusContratos,
} from '@ampara/api-client';
import { useQueries } from '@tanstack/react-query';

export type CoberturaDaPessoa = { plano: string; itens: Set<string> };

/**
 * Itens do catálogo cobertos para cada pessoa (FUN-02: "indicar quais itens estão cobertos pelo plano").
 * Junta os contratos vigentes do titular com as coberturas do plano de cada um (PLA-02).
 * A chave é o id da pessoa: `idTitular` para o titular e o id_dependente para os dependentes.
 */
export function useCoberturasPorPessoa(idTitular: string | undefined) {
  const contratos = useMeusContratos();
  const vigentes = contratos.data?.filter((c) => c.status !== 'CANCELADO') ?? [];
  const detalhes = useQueries({
    queries: vigentes.map((c) => getObterContratoQueryOptions(c.id_contrato)),
  });
  const idsPlanos = [...new Set(vigentes.map((c) => c.id_plano))];
  const planos = useQueries({ queries: idsPlanos.map((id) => getObterPlanoQueryOptions(id)) });

  const porPessoa = new Map<string, CoberturaDaPessoa>();
  for (const { data: contrato } of detalhes) {
    const plano = planos.find((p) => p.data?.id_plano === contrato?.id_plano)?.data;
    if (!contrato || !plano) continue;
    const itens = new Set(plano.coberturas.map((c) => c.id_item_catalogo));
    for (const pessoa of contrato.pessoas_cobertas) {
      const id = pessoa.tipo === 'TITULAR' ? idTitular : pessoa.id_dependente;
      if (id && !porPessoa.has(id)) porPessoa.set(id, { plano: plano.nome, itens });
    }
  }

  return {
    porPessoa,
    carregando: contratos.isPending || [...detalhes, ...planos].some((q) => q.isPending),
  };
}
