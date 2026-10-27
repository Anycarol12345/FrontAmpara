import { ApiError } from '@ampara/api-client';
import { describe, expect, it, vi } from 'vitest';
import { criarQueryClient } from './queryClient';

describe('criarQueryClient', () => {
  const retry = criarQueryClient().getDefaultOptions().queries?.retry as (
    tentativas: number,
    erro: unknown,
  ) => boolean;

  it('não repete erros 4xx', () => {
    expect(retry(0, new ApiError(404))).toBe(false);
    expect(retry(0, new ApiError(401))).toBe(false);
  });

  it('repete falhas de rede e 5xx até 2 vezes', () => {
    expect(retry(0, new ApiError(0))).toBe(true);
    expect(retry(1, new ApiError(503))).toBe(true);
    expect(retry(2, new ApiError(503))).toBe(false);
  });

  it('invalida as consultas de meta.invalida depois de uma mutation', async () => {
    const queryClient = criarQueryClient();
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries');

    await queryClient
      .getMutationCache()
      .build(queryClient, {
        mutationFn: async () => 'ok',
        meta: { invalida: [['/api/v1/gestao/planos']] },
      })
      .execute(undefined);

    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['/api/v1/gestao/planos'] });
  });
});
