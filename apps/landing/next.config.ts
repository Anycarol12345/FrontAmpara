import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const apiUrlInterna = process.env.API_URL_INTERNA || 'http://localhost:5080';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // packages/ui é publicado como código TypeScript, sem build próprio.
  transpilePackages: ['@ampara/ui', '@ampara/api-client'],
  // Build enxuto para a imagem Docker (FE-09). A raiz do monorepo entra no rastreamento das dependências.
  output: 'standalone',
  outputFileTracingRoot: fileURLToPath(new URL('../../', import.meta.url)),
  // O navegador chama /api na própria landing (mesma origem, sem CORS) e o Next repassa para o backend.
  async rewrites() {
    return [{ source: '/api/:caminho*', destination: `${apiUrlInterna}/api/:caminho*` }];
  },
};

export default nextConfig;
