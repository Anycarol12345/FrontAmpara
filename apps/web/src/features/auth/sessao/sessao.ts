import { renovarSessao, type LoginResponse } from '@ampara/api-client';
import { definirAccessToken, obterAccessToken, usuarioDoToken, type Usuario } from './token';

/** undefined = ainda verificando o cookie de refresh; null = sem sessão. */
export type EstadoSessao = Usuario | null | undefined;

let estado: EstadoSessao = undefined;
const ouvintes = new Set<() => void>();

function publicar(novo: EstadoSessao) {
  estado = novo;
  for (const ouvinte of ouvintes) ouvinte();
}

/** Store da sessão, lido pelo AuthProvider com useSyncExternalStore. */
export const sessaoStore = {
  assinar(ouvinte: () => void) {
    ouvintes.add(ouvinte);
    return () => ouvintes.delete(ouvinte);
  },
  ler: (): EstadoSessao => estado,
};

/** Guarda o access token da resposta do login ou da renovação. */
export function iniciarSessao(resposta: LoginResponse): Usuario | null {
  const usuario = usuarioDoToken(resposta.access_token, resposta.usuario.nome);
  definirAccessToken(usuario ? resposta.access_token : null);
  publicar(usuario);
  return usuario;
}

export function encerrarSessao() {
  definirAccessToken(null);
  publicar(null);
}

/**
 * Troca o cookie de refresh por um access token novo (AUT-03).
 * Usada ao abrir o app e pelo client da API quando recebe 401.
 */
export async function renovarAccessToken(): Promise<string | null> {
  try {
    iniciarSessao(await renovarSessao());
    return obterAccessToken();
  } catch {
    encerrarSessao();
    return null;
  }
}

let restauracao: Promise<unknown> | null = null;

/** Restaura a sessão ao carregar a página. Roda uma vez, mesmo com o StrictMode. */
export function restaurarSessao() {
  restauracao ??= renovarAccessToken();
  return restauracao;
}
