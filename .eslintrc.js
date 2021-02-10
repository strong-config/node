module.exports = {
  extends: ['@brickblock/eslint-config-base-ts'],
  parserOptions: {
    project: ['./tsconfig.eslint.json'],
    ecmaVersion: 2018,
    extraFileExtensions: ['.json'],
    sourceType: 'module',
  },
  ignorePatterns: ['**/config.d.ts', 'blackbox', 'example*/schema.json', 'lib'],
  overrides: [
    {
      files: ['src/{cli,integration-tests,e2e}/**/*', 'scripts/**/*'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
}
