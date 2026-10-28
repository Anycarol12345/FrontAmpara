import { env } from './env';

/** Endereço de uma tela do apps/web na funerária (ex.: http://demo.localhost:5173/cadastro). */
export function linkDoApp(slug: string, caminho: string) {
  const url = new URL(caminho, env.appUrl);
  // A funerária padrão abre no endereço sem subdomínio, igual à landing (localhost:5173).
  if (slug !== env.tenantPadrao) url.hostname = `${slug}.${url.hostname}`;
  return url.toString();
}
