import react from '@ampara/config/eslint/react';

export default [
  ...react,
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
];
