import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // packages/ui é publicado como código TypeScript, sem build próprio.
  transpilePackages: ['@ampara/ui'],
};

export default nextConfig;
