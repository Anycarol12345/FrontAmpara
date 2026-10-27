/** Corpo de erro da API no formato ProblemDetails (INF-07). */
type ProblemDetails = {
  status?: number;
  title?: string;
  detail?: string;
  code?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
};

/** Tipo único de erro para tudo que a API devolve fora do 2xx (FE-04). */
export class ApiError extends Error {
  readonly status: number;
  readonly titulo: string;
  readonly codigo: string | undefined;
  readonly traceId: string | undefined;
  /** Mensagens de validação por campo (400), como a API devolve. */
  readonly erros: Record<string, string[]>;

  constructor(status: number, corpo: ProblemDetails = {}) {
    super(corpo.detail ?? corpo.title ?? mensagemPadrao(status));
    this.name = 'ApiError';
    this.status = status;
    this.titulo = corpo.title ?? '';
    this.codigo = corpo.code;
    this.traceId = corpo.traceId;
    this.erros = corpo.errors ?? {};
  }

  get ehValidacao() {
    return this.status === 400 && Object.keys(this.erros).length > 0;
  }
}

export function ehApiError(erro: unknown): erro is ApiError {
  return erro instanceof ApiError;
}

function mensagemPadrao(status: number) {
  if (status === 0) return 'Não foi possível conectar ao servidor. Verifique sua internet.';
  if (status === 401) return 'Sua sessão expirou. Entre novamente.';
  if (status === 403) return 'Você não tem permissão para esta ação.';
  if (status === 404) return 'Não encontramos o que você procurava.';
  if (status >= 500) return 'Algo deu errado do nosso lado. Tente novamente em instantes.';
  return 'Não foi possível concluir a ação.';
}
