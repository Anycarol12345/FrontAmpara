import type { LoginResponse } from '@ampara/api-client';
import type { Perfil } from '@/features/auth';
import { iniciarSessao } from '@/features/auth/sessao/sessao';

const base64url = (objeto: object) =>
  btoa(JSON.stringify(objeto)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** JWT com as claims do AUT-02. A assinatura não importa: quem valida é o backend. */
export function tokenFalso(perfil: Perfil, extras: Record<string, string> = {}) {
  const claims = { sub: 'usuario-1', email: 'ana@demo.localhost', role: perfil, ...extras };
  return `${base64url({ alg: 'HS256' })}.${base64url(claims)}.assinatura`;
}

export function respostaDeLogin(perfil: Perfil, nome = 'Ana Souza'): LoginResponse {
  return {
    access_token: tokenFalso(perfil, perfil === 'ADMIN' ? {} : { id_tenant: 'tenant-1' }),
    expira_em: new Date(Date.now() + 15 * 60_000).toISOString(),
    usuario: { id: 'usuario-1', nome, role: perfil },
  };
}

/** Começa o teste já com sessão. */
export function entrarComo(perfil: Perfil, nome?: string) {
  return iniciarSessao(respostaDeLogin(perfil, nome));
}
