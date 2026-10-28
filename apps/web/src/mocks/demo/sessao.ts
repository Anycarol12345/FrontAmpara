import type { LoginResponse } from '@ampara/api-client';
import type { Perfil } from '@/features/auth';
import { CHAVE_DEMO } from '@/shared/lib/demo';

/**
 * Situação do cliente na demonstração: muda os contratos (e com eles as faturas e os avisos).
 * Para os outros perfis é sempre 'padrao'.
 */
export type Cenario = 'padrao' | 'suspenso' | 'sem-plano';

export type SessaoDemo = { perfil: Perfil; cenario: Cenario };

export const PESSOAS_DEMO: Record<Perfil, { nome: string; email: string }> = {
  CLIENTE: { nome: 'Ana Souza', email: 'ana.souza@exemplo.com' },
  FUNERARIA: { nome: 'Marcos Lima', email: 'marcos@ampara.demo' },
  FUNCIONARIO: { nome: 'Juliana Rocha', email: 'juliana@ampara.demo' },
  CONSULTOR: { nome: 'Rafael Nunes', email: 'rafael@ampara.demo' },
  TERCEIRO: { nome: 'Translados Boa Viagem', email: 'contato@boaviagem.demo' },
  ADMIN: { nome: 'Equipe Ampara', email: 'plataforma@ampara.demo' },
};

export function lerSessaoDemo(): SessaoDemo | null {
  try {
    const salva = localStorage.getItem(CHAVE_DEMO);
    return salva ? (JSON.parse(salva) as SessaoDemo) : null;
  } catch {
    return null;
  }
}

export function salvarSessaoDemo(sessao: SessaoDemo | null) {
  try {
    if (sessao) localStorage.setItem(CHAVE_DEMO, JSON.stringify(sessao));
    else localStorage.removeItem(CHAVE_DEMO);
  } catch {
    // Sem localStorage: a demonstração não sobrevive ao recarregar.
  }
}

const base64url = (objeto: object) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(objeto))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

/** Resposta do refresh com um JWT de mentira (claims do AUT-02). Só a interface lê o token. */
export function loginDemo({ perfil }: SessaoDemo): LoginResponse {
  const { nome, email } = PESSOAS_DEMO[perfil];
  const claims = {
    sub: `demo-${perfil.toLowerCase()}`,
    email,
    role: perfil,
    ...(perfil === 'ADMIN' ? {} : { id_tenant: 'tenant-demo' }),
    ...(perfil === 'TERCEIRO' ? { tipo_terceiro: 'FROTA' } : {}),
  };
  return {
    access_token: `${base64url({ alg: 'none' })}.${base64url(claims)}.demo`,
    expira_em: new Date(Date.now() + 8 * 3_600_000).toISOString(),
    usuario: { id: claims.sub, nome, role: perfil },
  };
}
