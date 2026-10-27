import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { configurarCliente } from './configuracao';
import { ApiError } from './erros';
import { requisicao } from './requisicao';

const API = 'http://api.teste';
const servidor = setupServer();

beforeAll(() => servidor.listen({ onUnhandledFrame: 'error' }));
afterEach(() => servidor.resetHandlers());
afterAll(() => servidor.close());

let token: string | null;
const renovarSessao = vi.fn<() => Promise<string | null>>();
const aoSessaoExpirar = vi.fn();

beforeEach(() => {
  token = 'token-velho';
  renovarSessao.mockReset();
  aoSessaoExpirar.mockReset();
  configurarCliente({
    baseUrl: API,
    obterToken: () => token,
    obterTenant: () => 'demo',
    renovarSessao,
    aoSessaoExpirar,
  });
});

/** Responde 401 para o token velho e 200 para o novo. */
function planosQueExigemTokenNovo() {
  return http.get(`${API}/api/v1/planos`, ({ request }) =>
    request.headers.get('Authorization') === 'Bearer token-novo'
      ? HttpResponse.json([{ nome: 'Acolher' }])
      : HttpResponse.json({ title: 'Não autorizado' }, { status: 401 }),
  );
}

describe('requisicao', () => {
  it('envia a URL base, o token, o X-Tenant e os cookies', async () => {
    let cabecalhos: Headers | undefined;
    servidor.use(
      http.get(`${API}/api/v1/planos`, ({ request }) => {
        cabecalhos = request.headers;
        return HttpResponse.json([]);
      }),
    );

    await requisicao('/api/v1/planos', { method: 'GET' });

    expect(cabecalhos?.get('Authorization')).toBe('Bearer token-velho');
    expect(cabecalhos?.get('X-Tenant')).toBe('demo');
  });

  it('renova a sessão uma única vez para várias requisições com 401 e repete cada uma', async () => {
    servidor.use(planosQueExigemTokenNovo());
    renovarSessao.mockImplementation(async () => {
      token = 'token-novo';
      return token;
    });

    const respostas = await Promise.all([
      requisicao('/api/v1/planos', { method: 'GET' }),
      requisicao('/api/v1/planos', { method: 'GET' }),
      requisicao('/api/v1/planos', { method: 'GET' }),
    ]);

    expect(renovarSessao).toHaveBeenCalledTimes(1);
    expect(respostas).toEqual([
      [{ nome: 'Acolher' }],
      [{ nome: 'Acolher' }],
      [{ nome: 'Acolher' }],
    ]);
    expect(aoSessaoExpirar).not.toHaveBeenCalled();
  });

  it('desloga quando a renovação falha', async () => {
    servidor.use(planosQueExigemTokenNovo());
    renovarSessao.mockResolvedValue(null);

    await expect(requisicao('/api/v1/planos', { method: 'GET' })).rejects.toMatchObject({
      status: 401,
    });
    expect(aoSessaoExpirar).toHaveBeenCalledTimes(1);
  });

  it('não tenta renovar quando o próprio login responde 401', async () => {
    servidor.use(
      http.post(`${API}/api/v1/auth/login`, () =>
        HttpResponse.json({ detail: 'E-mail ou senha inválidos.' }, { status: 401 }),
      ),
    );

    await expect(requisicao('/api/v1/auth/login', { method: 'POST' })).rejects.toThrow(
      'E-mail ou senha inválidos.',
    );
    expect(renovarSessao).not.toHaveBeenCalled();
  });

  it('converte o ProblemDetails em ApiError', async () => {
    servidor.use(
      http.post(`${API}/api/v1/auth/login`, () =>
        HttpResponse.json(
          {
            status: 400,
            title: 'Requisição inválida',
            detail: 'Um ou mais campos são inválidos.',
            code: 'Validacao',
            errors: { email: ['E-mail é obrigatório.'] },
            trace_id: '00-abc',
          },
          { status: 400 },
        ),
      ),
    );

    const erro = await requisicao('/api/v1/auth/login', { method: 'POST' }).catch((e) => e);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro).toMatchObject({
      status: 400,
      codigo: 'Validacao',
      traceId: '00-abc',
      erros: { email: ['E-mail é obrigatório.'] },
      ehValidacao: true,
    });
  });

  it('devolve undefined para respostas sem corpo (204)', async () => {
    servidor.use(
      http.post(`${API}/api/v1/auth/logout`, () => new HttpResponse(null, { status: 204 })),
    );

    await expect(requisicao('/api/v1/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });
});
