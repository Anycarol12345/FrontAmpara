import { headers } from 'next/headers';
import { listarPlanos } from '@/lib/api';

type Contexto = { params: Promise<{ slug: string }> };

/** Sitemap da landing da funerária: início, comparação e cada plano (FE-PUB-01). */
export async function GET(_requisicao: Request, { params }: Contexto) {
  const { slug } = await params;
  const host = (await headers()).get('host');
  const origem = `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${host}`;
  const planos = await listarPlanos(slug);

  const enderecos = ['/', '/planos', ...planos.map((plano) => `/planos/${plano.id_plano}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${enderecos.map((caminho) => `  <url><loc>${origem}${caminho}</loc><changefreq>weekly</changefreq></url>`).join('\n')}
</urlset>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
