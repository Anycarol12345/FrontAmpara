import react from '@ampara/config/eslint/react';
import packages from '@ampara/config/eslint/packages';

export default [
  ...react,
  ...packages.slice(-1),
  {
    // Componentes do shadcn/ui exportam o componente e as variantes juntos.
    files: ['src/components/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
];
