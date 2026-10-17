export default [
  { ignores: ['dist/**', '.astro/**', 'node_modules/**'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {},
  },
];
