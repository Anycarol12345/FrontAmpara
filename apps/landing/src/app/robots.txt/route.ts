import { headers } from 'next/headers';

/** robots.txt de cada endereço (plataforma ou funerária), apontando para o sitemap dele. */
export async function GET() {
  const host = (await headers()).get('host');
  const origem = `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${host}`;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${origem}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
