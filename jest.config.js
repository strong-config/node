module.exports = {
  collectCoverageFrom: ['src/**/*.ts', '!src/cli/index.ts'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePaths: ['./src/'],
  globals: {
    'ts-jest': {
      diagnostics: {
        warnOnly: true,
      },
    },
  },
}
