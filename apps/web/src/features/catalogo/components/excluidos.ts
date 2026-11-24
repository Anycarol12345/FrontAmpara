import type { CategoriaResponse } from '@ampara/api-client';

/**
 * O backend não apaga itens do catálogo: eles podem estar em planos, funerais e preferências.
 * "Excluir" desativa o item e o guarda nesta categoria, que fica inativa (escondida da família)
 * e fora da lista. Vale para toda a equipe e dá para restaurar.
 */
export const CATEGORIA_EXCLUIDOS = 'Excluídos';

export const ehExcluidos = (c: CategoriaResponse) => c.nome === CATEGORIA_EXCLUIDOS;
