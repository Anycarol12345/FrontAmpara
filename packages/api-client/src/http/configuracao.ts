export type ConfiguracaoCliente = {
  /** Origem da API. Vazio = mesma origem (o Vite e o nginx repassam /api para o backend). */
  baseUrl: string;
  /** Access token atual, guardado só em memória (FE-07). */
  obterToken: () => string | null;
  /** Slug da funerária, enviado no cabeçalho X-Tenant (TEN-01). */
  obterTenant: () => string | null;
  /** Renova a sessão pelo cookie de refresh e devolve o token novo, ou null se não der. */
  renovarSessao: () => Promise<string | null>;
  /** Chamado quando a renovação falha: o app limpa a sessão e volta ao login. */
  aoSessaoExpirar: () => void;
};

let configuracao: ConfiguracaoCliente = {
  baseUrl: '',
  obterToken: () => null,
  obterTenant: () => null,
  renovarSessao: async () => null,
  aoSessaoExpirar: () => {},
};

/** Chamado uma vez pelo app, antes de qualquer requisição. */
export function configurarCliente(parcial: Partial<ConfiguracaoCliente>) {
  configuracao = { ...configuracao, ...parcial };
}

export function obterConfiguracao(): ConfiguracaoCliente {
  return configuracao;
}
