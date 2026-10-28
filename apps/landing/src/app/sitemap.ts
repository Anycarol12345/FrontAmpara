import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

/** Sitemap da landing da plataforma (FE-PUB-04). O de cada funerária fica em f/[slug]/sitemap.ts. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get('host');
  const origem = `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${host}`;
  return [
    { url: `${origem}/para-funerarias`, changeFrequency: 'monthly', priority: 1 },
    { url: `${origem}/cadastrar-funeraria`, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
