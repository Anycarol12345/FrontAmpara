import { getAutenticacaoMock } from './gerado/api/autenticacao/autenticacao.msw';
import { getPlanosMock } from './gerado/api/planos/planos.msw';

export * from './gerado/api/autenticacao/autenticacao.msw';
export * from './gerado/api/planos/planos.msw';

/** Todos os handlers do MSW gerados pelo Orval, para testes (FE-10) e desenvolvimento sem backend. */
export const handlersPadrao = () => [...getAutenticacaoMock(), ...getPlanosMock()];
