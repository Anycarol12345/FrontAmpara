import { defineConfig, type InputTransformerFn } from 'orval';

type Schema = { type?: unknown; pattern?: string; [chave: string]: unknown };

/**
 * O .NET descreve números como `["integer", "string"]` com um `pattern` (aceita ler número em texto),
 * mas sempre responde com número. Deixamos só o tipo numérico: os tipos gerados ficam precisos
 * e o gerador de Zod do Orval não quebra com o `default` dessas uniões.
 */
function normalizarNumeros(no: unknown) {
  if (Array.isArray(no)) {
    no.forEach(normalizarNumeros);
    return;
  }
  if (!no || typeof no !== 'object') return;

  const schema = no as Schema;
  if (Array.isArray(schema.type)) {
    const tipos = schema.type as string[];
    const numerico = tipos.find((t) => t === 'integer' || t === 'number');
    if (numerico && tipos.includes('string')) {
      const resto = tipos.filter((t) => t !== 'string');
      schema.type = resto.length === 1 ? numerico : resto;
      delete schema.pattern;
    }
  }
  Object.values(schema).forEach(normalizarNumeros);
}

/** As tags viram nomes de pasta: "Autenticação" → "autenticacao". */
const normalizarTags = (spec: Parameters<InputTransformerFn>[0]) => {
  const semAcento = (tag: string) =>
    tag
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();

  for (const operacoes of Object.values(spec.paths ?? {})) {
    for (const operacao of Object.values(operacoes ?? {})) {
      const op = operacao as { tags?: string[] };
      if (Array.isArray(op.tags)) op.tags = op.tags.map(semAcento);
    }
  }
};

const normalizar: InputTransformerFn = (spec) => {
  normalizarTags(spec);
  normalizarNumeros(spec);
  return spec;
};

const input = {
  target: './openapi/openapi.json',
  override: { transformer: normalizar },
};

// FE-04 / FDEC-02: hooks do TanStack Query, mocks do MSW e schemas Zod a partir do OpenAPI do backend.
export default defineConfig({
  ampara: {
    input,
    output: {
      mode: 'tags-split',
      target: './src/gerado/api',
      schemas: './src/gerado/modelos',
      client: 'react-query',
      httpClient: 'fetch',
      mock: { generators: [{ type: 'msw', delay: false }] },
      clean: true,
      override: {
        mutator: { path: './src/http/requisicao.ts', name: 'requisicao' },
        fetch: { includeHttpResponseReturnType: false },
        query: { signal: true },
      },
    },
  },
  amparaZod: {
    input,
    output: {
      mode: 'tags-split',
      target: './src/gerado/zod',
      client: 'zod',
      fileExtension: '.zod.ts',
      clean: true,
    },
  },
});
