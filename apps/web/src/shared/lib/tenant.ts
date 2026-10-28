import { env } from './env';

// Mesmos subdomínios reservados do backend (TenancyOptions).
const RESERVADOS = new Set(['www', 'api', 'admin', 'app']);

/**
 * Slug da funerária do endereço acessado (FE-03, DEC-02): `demo.localhost` → `demo`.
 * Sem subdomínio, usa a funerária padrão do ambiente. O /admin roda no domínio da plataforma, sem funerária.
 */
export function obterSlugDoTenant(
  local: Pick<Location, 'hostname' | 'pathname'> = window.location,
) {
  if (local.pathname === '/admin' || local.pathname.startsWith('/admin/')) return null;

  const host = local.hostname.toLowerCase();
  const sufixo = `.${env.dominioBase.toLowerCase()}`;
  if (host.endsWith(sufixo)) {
    const subdominio = host.slice(0, -sufixo.length);
    if (subdominio && !subdominio.includes('.') && !RESERVADOS.has(subdominio)) return subdominio;
  }

  return env.tenantPadrao || null;
}

/**
 * Endereço da landing da funerária atual: no subdomínio dela (demo.localhost:3000)
 * ou, sem subdomínio, o endereço principal do site (localhost:3000).
 */
export function urlDoSite(caminho = '/', local: Pick<Location, 'hostname'> = window.location) {
  const url = new URL(caminho, env.siteUrl);
  const host = local.hostname.toLowerCase();
  const sufixo = `.${env.dominioBase.toLowerCase()}`;
  if (host.endsWith(sufixo)) {
    const subdominio = host.slice(0, -sufixo.length);
    if (subdominio && !subdominio.includes('.') && !RESERVADOS.has(subdominio)) {
      url.hostname = `${subdominio}.${url.hostname}`;
    }
  }
  return url.toString();
}

/** Endereço da mesma tela em outra funerária (troca de subdomínio). */
export function urlDaFuneraria(slug: string, caminho: string, local: Location = window.location) {
  const porta = local.port ? `:${local.port}` : '';
  return `${local.protocol}//${slug}.${env.dominioBase}${porta}${caminho}`;
}
