/** Configuração lida em tempo de execução de /config.js (FE-09). Tem prioridade sobre o .env do build. */
type ConfigExecucao = {
  apiUrl?: string;
  hubUrl?: string;
  dominioBase?: string;
  tenantPadrao?: string;
  siteUrl?: string;
};

declare global {
  interface Window {
    __AMPARA_CONFIG__?: ConfigExecucao;
  }
}

const execucao: ConfigExecucao = (typeof window !== 'undefined' && window.__AMPARA_CONFIG__) || {};

const ler = (chave: keyof ConfigExecucao, doBuild: string | undefined, padrao: string) =>
  execucao[chave] || doBuild || padrao;

export const env = {
  /** Origem da API. Vazio = mesma origem: o Vite (dev) e o nginx (Docker) repassam /api ao backend. */
  apiUrl: ler('apiUrl', import.meta.env.VITE_API_URL, ''),
  /** Endereço do hub do SignalR (FE-08). */
  hubUrl: ler('hubUrl', import.meta.env.VITE_HUB_URL, '/hubs/notificacoes'),
  /** Domínio da plataforma. A funerária é o subdomínio dele (ex.: demo.localhost). */
  dominioBase: ler('dominioBase', import.meta.env.VITE_DOMINIO_BASE, 'localhost'),
  /** Funerária usada quando o endereço não tem subdomínio (ex.: localhost em desenvolvimento). */
  tenantPadrao: ler('tenantPadrao', import.meta.env.VITE_TENANT_PADRAO, ''),
  /** Landing (apps/landing): para onde levam o "Voltar ao site" e o "Voltar para o início". */
  siteUrl: ler('siteUrl', import.meta.env.VITE_SITE_URL, 'http://localhost:3000'),
} as const;
