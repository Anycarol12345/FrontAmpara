import { defineConfig, type InputTransformerFn } from 'orval';

/** As tags viram nomes de pasta: "Autenticação" → "autenticacao". */
const normalizarTags: InputTransformerFn = (spec) => {
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
  return spec;
};

const input = {
  target: './openapi/openapi.json',
  override: { transformer: normalizarTags },
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
