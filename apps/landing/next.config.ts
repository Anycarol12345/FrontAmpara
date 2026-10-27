import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // packages/ui é publicado como código TypeScript, sem build próprio.
  transpilePackages: ['@ampara/ui'],
  // Build enxuto para a imagem Docker (FE-09). A raiz do monorepo entra no rastreamento das dependências.
  output: 'standalone',
  outputFileTracingRoot: fileURLToPath(new URL('../../', import.meta.url)),
};

export default nextConfig;
