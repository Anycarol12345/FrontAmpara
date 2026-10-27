// Variáveis lidas no servidor do Next (FE-PUB-01). Lidas em tempo de execução: a mesma imagem serve qualquer ambiente.
export const env = {
  /** Endereço da API visto pelo servidor do Next (no Docker, o nome do serviço da API). */
  apiUrlInterna: process.env.API_URL_INTERNA || 'http://localhost:5080',
  /** Domínio da plataforma. Cada funerária é um subdomínio dele (demo.localhost). */
  dominioBase: process.env.DOMINIO_BASE || 'localhost',
  /** Endereço do apps/web (sistema). O subdomínio da funerária é acrescentado nos links. */
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  /** Quanto tempo (s) as páginas guardam os dados da API antes de buscar de novo. */
  revalidar: Number(process.env.REVALIDAR_SEGUNDOS || 300),
} as const;
