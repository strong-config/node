/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

module.exports = {
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/cli/index.ts',
    '!src/integration-tests/**/*',
    '!src/e2e/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 100,
      lines: 95,
      statements: 95,
    },
  },
  globals: {
    'ts-jest': {
      /*
       * This disables type-checking which makes tests a lot faster.
       * Should be an ok tradeoff as we still have type-checking in our
       * IDEs as well as through 'yarn build' when building the project.
       * https://kulshekhar.github.io/ts-jest/docs/getting-started/options/isolatedModules
       */
      isolatedModules: true,
    },
  },
  preset: 'ts-jest',
  setupFilesAfterEnv: ['jest-extended/all'],
  testEnvironment: 'node',
}
