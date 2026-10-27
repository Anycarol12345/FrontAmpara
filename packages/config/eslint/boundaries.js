// Mapa de features do FE-01 (cada uma corresponde a um módulo do backend).
const FEATURES = [
  'auth',
  'usuarios',
  'tenants',
  'plataforma',
  'clientes',
  'planos',
  'catalogo',
  'contratos',
  'financeiro',
  'funeral',
  'translado',
  'documentos',
  'terceiros',
  'notificacoes',
  'relatorios',
];

const restrict = (patterns) => ({
  'no-restricted-imports': ['error', { patterns }],
});

export default [
  // Cada feature: não importa o app nem arquivos internos de OUTRAS features.
  // Importar `@/features/outra` (o index.ts) continua permitido.
  ...FEATURES.map((feature) => {
    const outras = FEATURES.filter((f) => f !== feature);
    return {
      files: [`src/features/${feature}/**/*.{ts,tsx}`],
      rules: restrict([
        {
          group: outras.map((f) => `@/features/${f}/**`),
          message: 'Importe outra feature apenas pelo index.ts (ex.: @/features/nome).',
        },
        {
          group: ['@/app', '@/app/**'],
          message: 'Features não podem importar o app.',
        },
      ]),
    };
  }),

  // shared: genérico, não conhece features nem app.
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: restrict([
      {
        group: ['@/features', '@/features/**', '@/app', '@/app/**'],
        message: 'shared não pode importar features nem o app.',
      },
    ]),
  },
];

export { FEATURES };
