import { NextResponse, type NextRequest } from 'next/server';
import { slugDoHost } from './lib/tenant';

/**
 * Resolve a funerária pelo subdomínio (FE-PUB-01): `demo.localhost:3000/planos` vira a rota interna
 * `/f/demo/planos`. Sem subdomínio, a requisição segue para a landing da plataforma (FE-PUB-04).
 */
export function proxy(request: NextRequest) {
  const slug = slugDoHost(request.headers.get('host'), process.env.DOMINIO_BASE || 'localhost');
  if (!slug) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/f/${slug}${url.pathname === '/' ? '' : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Fora: chamadas à API, arquivos do Next e arquivos com extensão (exceto o sitemap da funerária).
  matcher: ['/((?!api|_next|f/|robots\\.txt|.*\\..*).*)', '/sitemap.xml'],
};
