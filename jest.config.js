module.exports = {
  collectCoverageFrom: ['src/**/*.ts', '!src/cli/index.ts'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      diagnostics: {
        warnOnly: true,
      },
    },
  },
}
