import type { PlanoResponse } from '@ampara/api-client';
import { numero } from './formatar';

/** Destaques de cada plano: as primeiras coberturas e o que vem nas configurações. */
export function destaquesDoPlano(plano: PlanoResponse, limite = 4) {
  const itens = plano.coberturas.map((c) =>
    numero(c.quantidade) > 1 ? `${c.nome} (${numero(c.quantidade)})` : c.nome,
  );
  const config = plano.configuracoes;
  const kmTranslado = numero(config?.translado?.km_incluso);
  if (kmTranslado > 0) itens.push(`Translado de até ${kmTranslado} km`);
  if (config?.cremacao_inclusa) itens.push('Cremação inclusa');
  if (config?.transmissao_online) itens.push('Transmissão online da cerimônia');
  const dependentes = numero(plano.limite_dependentes);
  if (dependentes > 0) itens.push(`Até ${dependentes} dependentes`);
  return itens.slice(0, limite);
}
