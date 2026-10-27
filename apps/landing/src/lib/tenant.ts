// Mesmos subdomínios reservados do backend (SubdominiosReservados, TEN-02).
export const SUBDOMINIOS_RESERVADOS = new Set([
  'admin',
  'api',
  'app',
  'www',
  'web',
  'mail',
  'email',
  'smtp',
  'ftp',
  'cdn',
  'static',
  'assets',
  'status',
  'suporte',
  'ajuda',
  'blog',
  'docs',
  'login',
  'auth',
  'cadastro',
  'onboarding',
  'gestao',
  'terceiros',
  'plataforma',
  'funeraria',
  'funerarias',
]);

/** `demo.localhost:3000` → `demo`. Sem subdomínio (ou reservado) é a landing da plataforma. */
export function slugDoHost(host: string | null, dominioBase: string): string | null {
  if (!host) return null;
  const nome = (host.split(':')[0] ?? '').toLowerCase();
  const sufixo = `.${dominioBase.toLowerCase()}`;
  if (!nome.endsWith(sufixo)) return null;

  const subdominio = nome.slice(0, -sufixo.length);
  if (!subdominio || subdominio.includes('.') || SUBDOMINIOS_RESERVADOS.has(subdominio)) {
    return null;
  }
  return subdominio;
}
