// @ts-check
const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      // TypeScript compiler enforces these better than ESLint
      'no-undef': 'off',
      'no-unused-vars': 'off', // Use TypeScript's noUnusedLocals instead
      'no-console': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'src/database/migrations/**'],
  },
];
