import { getIdentidadeVisualQueryKey, getObterConfiguracoesQueryKey } from '@ampara/api-client';

export const classeSelect =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15';

/** "5, 10, 15" → [5, 10, 15], sem repetidos e em ordem. Devolve null se algum valor não for inteiro. */
export function lerListaDeDias(texto: string, minimo: number, maximo: number): number[] | null {
  const partes = texto
    .split(/[,;\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const dias = partes.map(Number);
  if (dias.some((d) => !Number.isInteger(d) || d < minimo || d > maximo)) return null;
  return [...new Set(dias)].sort((a, b) => a - b);
}

/** Depois de salvar, recarrega as configurações e a identidade visual usada nas telas. */
export const invalidaConfiguracoes = {
  mutation: {
    meta: { invalida: [getObterConfiguracoesQueryKey(), getIdentidadeVisualQueryKey()] },
  },
};
