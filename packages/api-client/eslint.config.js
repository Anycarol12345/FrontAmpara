import globals from 'globals';
import packages from '@ampara/config/eslint/packages';

export default [
  { ignores: ['src/gerado/**'] },
  ...packages,
  { files: ['scripts/**/*.mjs'], languageOptions: { globals: globals.node } },
];
