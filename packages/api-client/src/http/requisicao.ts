import { obterConfiguracao } from './configuracao';
import { ApiError } from './erros';

// Rotas em que um 401 é resposta final, não token vencido.
const ROTAS_SEM_RENOVACAO = ['/auth/login', '/auth/refresh', '/auth/logout'];

let renovacaoEmAndamento: Promise<string | null> | null = null;

/**
 * Requisição usada por todo o client gerado pelo Orval (FE-04).
 * Adiciona a URL base, o access token e o X-Tenant, envia o cookie de refresh
 * e, ao receber 401, renova a sessão uma única vez antes de deslogar.
 */
export async function requisicao<T>(url: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await enviar(url, opcoes);

  if (resposta.status === 401 && !ROTAS_SEM_RENOVACAO.some((rota) => url.includes(rota))) {
    const token = await renovarUmaVez();
    if (!token) {
      obterConfiguracao().aoSessaoExpirar();
      throw await paraErro(resposta);
    }
    return lerResposta<T>(await enviar(url, opcoes, token));
  }

  return lerResposta<T>(resposta);
}

/** Requisições que chegam juntas com 401 esperam a mesma renovação (fila). */
function renovarUmaVez() {
  renovacaoEmAndamento ??= obterConfiguracao()
    .renovarSessao()
    .catch(() => null)
    .finally(() => {
      renovacaoEmAndamento = null;
    });
  return renovacaoEmAndamento;
}

async function enviar(url: string, opcoes: RequestInit, token?: string) {
  const { baseUrl, obterToken, obterTenant } = obterConfiguracao();
  const cabecalhos = new Headers(opcoes.headers);
  cabecalhos.set('Accept', 'application/json');

  const accessToken = token ?? obterToken();
  if (accessToken) cabecalhos.set('Authorization', `Bearer ${accessToken}`);

  const tenant = obterTenant();
  if (tenant) cabecalhos.set('X-Tenant', tenant);

  try {
    return await fetch(`${baseUrl}${url}`, {
      ...opcoes,
      headers: cabecalhos,
      credentials: 'include',
    });
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === 'AbortError') throw erro;
    throw new ApiError(0);
  }
}

async function lerResposta<T>(resposta: Response): Promise<T> {
  if (!resposta.ok) throw await paraErro(resposta);
  const texto = await resposta.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}

async function paraErro(resposta: Response) {
  try {
    return new ApiError(resposta.status, await resposta.json());
  } catch {
    return new ApiError(resposta.status);
  }
}

export default requisicao;

// Tipos lidos pelo Orval: todo erro dos hooks gerados é um ApiError, e o corpo segue o tipo do OpenAPI.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ErrorType<_Erro> = ApiError;
export type BodyType<Corpo> = Corpo;
