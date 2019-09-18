module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [1, 'always', 120],
    'scope-case': [0, 'always', 'PascalCase'],
  },
}
