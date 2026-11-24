import { NextResponse, type NextRequest } from 'next/server';
import { slugDoHost } from './lib/tenant';

/** Páginas da plataforma, que nunca viram a landing de uma funerária. */
const PAGINAS_DA_PLATAFORMA = ['/para-funerarias', '/cadastrar-funeraria'];

/**
 * Resolve a funerária pelo subdomínio (FE-PUB-01): `demo.localhost:3000/planos` vira a rota interna
 * `/f/demo/planos`. Sem subdomínio vale a funerária padrão (TENANT_PADRAO) ou, sem ela, a landing
 * da plataforma (FE-PUB-04), que também fica sempre em /para-funerarias.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PAGINAS_DA_PLATAFORMA.some((pagina) => pathname.startsWith(pagina))) {
    return NextResponse.next();
  }

  // Sem subdomínio, vale a funerária padrão (TENANT_PADRAO).
  const slug =
    slugDoHost(request.headers.get('host'), process.env.DOMINIO_BASE || 'localhost') ??
    (process.env.TENANT_PADRAO || null);
  if (!slug) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/f/${slug}${url.pathname === '/' ? '' : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Fora: chamadas à API, arquivos do Next e arquivos com extensão (exceto o sitemap da funerária).
  matcher: ['/((?!api|_next|f/|robots\\.txt|.*\\..*).*)', '/sitemap.xml'],
};
