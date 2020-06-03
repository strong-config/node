module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
    'plugin:json/recommended',
  ],
  plugins: ['@typescript-eslint', 'prettier', 'yaml'],
  env: {
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    eqeqeq: ['error', 'always'],
    'prefer-regex-literals': 'error',
    'default-param-last': 'error',
    // Overwrites
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-empty-interface': 'warn',
  },
  reportUnusedDisableDirectives: true,
}
