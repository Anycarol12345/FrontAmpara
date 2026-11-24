import 'server-only';
import type {
  IdentidadeVisualResponse,
  ItemResponse,
  PlanoResponse,
  PlanoResumoResponse,
} from '@ampara/api-client';
import { cache } from 'react';
import { env } from './env';

// Leitura da API no servidor do Next (FE-PUB-01). Cada funerária vai no X-Tenant;
// os dados ficam em cache e são revalidados de tempos em tempos (páginas com revalidação).

async function buscar<T>(slug: string, caminho: string): Promise<T | null> {
  const resposta = await fetch(`${env.apiUrlInterna}/api/v1${caminho}`, {
    headers: { 'X-Tenant': slug, Accept: 'application/json' },
    next: { revalidate: env.revalidar, tags: [`funeraria:${slug}`] },
  });

  if (resposta.status === 404 || resposta.status === 400) return null;
  if (!resposta.ok) throw new Error(`API respondeu ${resposta.status} em ${caminho}`);
  return (await resposta.json()) as T;
}

/** Marca, contatos e nome da funerária. Null quando o subdomínio não é de nenhuma funerária. */
export const obterFuneraria = cache((slug: string) =>
  buscar<IdentidadeVisualResponse>(slug, '/tenant/configuracoes'),
);

/** Planos ativos, com coberturas e configurações (o resumo da listagem não traz as coberturas). */
export const listarPlanos = cache(async (slug: string): Promise<PlanoResponse[]> => {
  const resumos = (await buscar<PlanoResumoResponse[]>(slug, '/planos')) ?? [];
  const planos = await Promise.all(
    resumos
      .filter((plano) => plano.ativo !== false && plano.id_plano)
      .map((plano) => obterPlano(slug, plano.id_plano!)),
  );
  // Do mais barato ao mais completo, como no protótipo (a API devolve em ordem alfabética).
  return planos
    .filter((plano): plano is PlanoResponse => plano !== null)
    .sort((a, b) => Number(a.valor_mensal) - Number(b.valor_mensal));
});

export const obterPlano = cache((slug: string, id: string) =>
  buscar<PlanoResponse>(slug, `/planos/${encodeURIComponent(id)}`),
);

export const listarCatalogo = cache(
  async (slug: string) => (await buscar<ItemResponse[]>(slug, '/catalogo')) ?? [],
);
