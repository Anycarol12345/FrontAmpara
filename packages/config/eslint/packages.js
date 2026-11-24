import base from './index.js';

export default [
  ...base,
  {
    files: ['**/*.{ts,tsx,js}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@ampara/web', '@ampara/web/*', '@ampara/landing', '@ampara/landing/*'],
              message: 'Pacotes não podem importar código dos apps.',
            },
          ],
        },
      ],
    },
  },
];
