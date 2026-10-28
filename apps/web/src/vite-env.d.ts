/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_PROXY?: string;
  readonly VITE_HUB_URL?: string;
  readonly VITE_DOMINIO_BASE?: string;
  readonly VITE_TENANT_PADRAO?: string;
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
