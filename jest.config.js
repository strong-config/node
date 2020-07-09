/** @typedef {import('ts-jest')} */
/** @type {import('@jest/types').Config.InitialOptions} */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['jest-extended'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/cli/index.ts',
    '!src/integration-tests/**/*',
    '!src/e2e/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
}
