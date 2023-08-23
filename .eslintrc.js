module.exports = {
  extends: [
    // https://eslint.org/docs/rules/
    'eslint:recommended',

    // https://github.com/prettier/eslint-config-prettier
    'prettier',

    // https://github.com/typescript-eslint/typescript-eslint/blob/67537b863a8a98383796abb404224fdfc1c7b996/packages/eslint-plugin/src/configs/recommended.json
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',

    // https://github.com/benmosher/eslint-plugin-import/blob/3aefa79f167b998485733a1d7f9ba53b8d5bcc80/config/typescript.js
    'plugin:import/typescript',

    // https://github.com/benmosher/eslint-plugin-import/blob/master/config/errors.js
    'plugin:import/errors',

    // https://github.com/benmosher/eslint-plugin-import/blob/master/config/warnings.js
    'plugin:import/warnings',

    // https://github.com/jest-community/eslint-plugin-jest
    'plugin:jest/recommended',
    'plugin:jest/style',

    // https://github.com/dangreenisrael/eslint-plugin-jest-formatting/blob/master/src/index.ts#L163-L181
    'plugin:jest-formatting/strict',

    // https://github.com/azeemba/eslint-plugin-json/blob/master/src/index.js#L154-L158
    'plugin:json/recommended',

    // https://github.com/xjamundx/eslint-plugin-promise/blob/v4.0.1/index.js#L28-L42
    'plugin:promise/recommended',

    // https://github.com/nodesecurity/eslint-plugin-security/blob/eefca90e0e4fabab92a1423e43525bf78461312e/index.js#L39-L57
    'plugin:security/recommended',

    // https://github.com/SonarSource/eslint-plugin-sonarjs
    'plugin:sonarjs/recommended',

    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/master/index.js
    'plugin:unicorn/recommended',

    // https://github.com/aminya/eslint-plugin-yaml/blob/4bb74fd92a66982b17a452f97c40eabba1d6b838/src/index.ts#L97-L103
    'plugin:yaml/recommended',
  ],
  ignorePatterns: [
    '!.github',
    '**/config.d.ts',
    '.vscode',
    'blackbox',
    'coverage',
    'example*/schema.json',
    'lib',
    'node_modules',
    'tsconfig*.json',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.eslint.json'],
    ecmaFeatures: {
      jsx: true, // Allows for parsing of embedded JSX in *.ts files
    },
    ecmaVersion: 2021,
    extraFileExtensions: ['.json'],
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['src/{cli,integration-tests,e2e}/**/*', 'scripts/**/*'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  root: true,

  /*
   * Reports directive comments like // eslint-disable-line when no errors would
   * have been reported on that line anyway. This can be useful to prevent future errors from unexpectedly
   * being suppressed, by cleaning up old eslint-disable comments which are no longer applicable.
   * https://eslint.org/docs/user-guide/command-line-interface#--report-unused-disable-directives
   */
  reportUnusedDisableDirectives: true,

  rules: {
    /*
     * Require Following Curly Brace Conventions
     * https://eslint.org/docs/rules/curly
     */
    curly: 'error',

    /*
     * Enforce default parameters to be last.
     * Putting default parameter at last allows function calls to omit optional tail arguments.
     * https://eslint.org/docs/rules/default-param-last
     */
    'default-param-last': 'error',

    /*
     * disallow nested ternary expressions
     * https://eslint.org/docs/rules/no-nested-ternary
     */
    'no-nested-ternary': 'error',

    /*
     * require an empty line between class members
     * https://eslint.org/docs/rules/lines-between-class-members
     */
    'lines-between-class-members': ['error', 'always'],

    /*
     * Disallows consecutive line comments in favor of block comments. Additionally,
     * requires block comments to have an aligned * character before each line.
     * https://eslint.org/docs/rules/multiline-comment-style
     */
    'multiline-comment-style': ['error', 'starred-block'],

    /*
     * enforce adding specific exceptions when using console.log()
     * so we don't forget any accidental console.logs in the code
     * https://eslint.org/docs/rules/no-console
     */
    'no-console': ['error', { allow: ['assert'] }],

    /*
     * Disallow specific imports
     * https://eslint.org/docs/rules/no-restricted-imports
     */
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'node-fetch',
            message: 'We use axios as our HTTP client',
          },
          {
            name: 'request',
            message: 'We use axios as our HTTP client',
          },
          {
            name: 'superagent',
            message: 'We use axios as our HTTP client',
          },
          {
            name: 'moment',
            message:
              'We use date-fns as our date utility library. Moment.js is VERY heavy: https://bundlephobia.com/result?p=moment@latest',
          },
          {
            name: 'express',
            message:
              'We use koa for all our node.js services as outlined in our microservices guidelines: https://git.brickblock.sh/docs/microservice-guidelines',
          },
          {
            name: 'hapi',
            message:
              'We use koa for all our node.js services as outlined in our microservices guidelines: https://git.brickblock.sh/docs/microservice-guidelines',
          },
          {
            name: 'lodash',
            message: 'We use ramda as our standard utility library',
          },
          {
            name: 'underscore',
            message: 'We use ramda as our standard utility library',
          },
          {
            name: 'rambda',
            message: 'We use ramda as our standard utility library',
          },
        ],
      },
    ],

    /*
     * don't allow the same variable name inside a given scope
     * https://eslint.org/docs/rules/no-shadow
     */
    'no-shadow': 'error',

    /*
     * require let or const instead of var
     * https://eslint.org/docs/rules/no-var
     */
    'no-var': 'error',

    'padding-line-between-statements': [
      'error',
      // Blank line before return
      { blankLine: 'always', prev: '*', next: 'return' },

      // Blank line before and after classes
      { blankLine: 'always', prev: '*', next: 'class' },
      { blankLine: 'always', prev: 'class', next: '*' },

      // Blank line before exports
      { blankLine: 'always', prev: '*', next: 'export' },
      { blankLine: 'always', prev: '*', next: 'cjs-export' },

      // Blank line around if- and switch-statements
      { blankLine: 'always', prev: '*', next: 'if' },
      { blankLine: 'always', prev: 'if', next: '*' },
      { blankLine: 'always', prev: '*', next: 'switch' },
      { blankLine: 'always', prev: 'switch', next: '*' },

      // Blank line around loops
      { blankLine: 'always', prev: '*', next: 'for' },
      { blankLine: 'always', prev: 'for', next: '*' },
      { blankLine: 'always', prev: '*', next: 'while' },
      { blankLine: 'always', prev: 'while', next: '*' },
      { blankLine: 'always', prev: '*', next: 'do' },
      { blankLine: 'always', prev: 'do', next: '*' },
      { blankLine: 'always', prev: '*', next: 'with' },
      { blankLine: 'always', prev: 'with', next: '*' },

      // Blank line around try/catch blocks
      { blankLine: 'always', prev: '*', next: 'try' },
      { blankLine: 'always', prev: 'try', next: '*' },
    ],
    /* eslint-enable unicorn/prevent-abbreviations */

    /*
     * if a let variable is never reassigned, use const instead of let
     * https://eslint.org/docs/rules/prefer-const
     */
    'prefer-const': 'error',

    /*
     * Disallow use of the RegExp constructor in favor of regular expression literals
     * https://eslint.org/docs/rules/prefer-regex-literals
     */
    'prefer-regex-literals': 'error',

    /***************************************************************/
    /*                                                             */
    /*                          PLUGINS                            */
    /*                                                             */
    /***************************************************************/
    // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/no-require-imports.md
    '@typescript-eslint/no-require-imports': 'error',

    // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/no-unnecessary-qualifier.md
    '@typescript-eslint/no-unnecessary-qualifier': 'error',

    // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/no-useless-constructor.md
    '@typescript-eslint/no-useless-constructor': 'error',

    // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/prefer-for-of.md
    '@typescript-eslint/prefer-for-of': 'error',

    // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/prefer-function-type.md
    '@typescript-eslint/prefer-function-type': 'error',

    // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/prefer-includes.md
    '@typescript-eslint/prefer-includes': 'error',

    // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/prefer-string-starts-ends-with.md
    '@typescript-eslint/prefer-string-starts-ends-with': 'error',

    // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/promise-function-async.md
    '@typescript-eslint/promise-function-async': 'error',

    // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/require-array-sort-compare.md
    '@typescript-eslint/require-array-sort-compare': 'error',

    // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/prefer-regexp-exec.md
    '@typescript-eslint/prefer-regexp-exec': 'error',

    // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/unified-signatures.md
    '@typescript-eslint/unified-signatures': 'error',

    /*
     * Imports should always come first
     * https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/first.md
     */
    'import/first': 'error',

    /*
     * Reports if a module's default export is unnamed. This includes several types of unnamed data types;
     * literals, object expressions, arrays, anonymous functions, arrow functions, and anonymous class declarations.
     *
     * Ensuring that default exports are named helps improve the grepability of the codebase by encouraging the re-use
     * of the same identifier for the module's default export at its declaration site and at its import sites.
     * https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-anonymous-default-export.md
     */
    'import/no-anonymous-default-export': 'error',

    /*
     * With both CommonJS' require and the ES6 modules' import syntax, it is possible to import a module but not to use its result.
     * This can be done explicitly by not assigning the module to as variable. Doing so can mean either of the following things:
     *
     *   1. The module is imported but not used
     *   2. The module has side-effects (like should). Having side-effects, makes it hard to know whether the module is actually used or can be removed. It can also make it harder to test or mock parts of your application.
     *
     * This rule aims to remove modules with side-effects by reporting when a module is imported but not assigned.
     * https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-unassigned-import.md
     */
    'import/no-unassigned-import': ['error', { allow: ['src/**/*.css'] }],

    /*
     * When there is only a single export from a module, prefer using default export over named export.
     * https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/prefer-default-export.md
     */
    'import/prefer-default-export': 'error',

    /*
     * This doesn't work nicely with how we export React Components => https://github.com/benmosher/eslint-plugin-import/issues/544
     * https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-named-as-default.md
     */
    'import/no-named-as-default': 'off',

    /*
     * Enforce consistent use of 'test' and 'it'.
     * The default configuration forces top level test to use 'test' and all tests nested within describe to use 'it'.
     * https://github.com/jest-community/eslint-plugin-jest/blob/master/docs/rules/consistent-test-it.md
     */
    'jest/consistent-test-it': 'error',

    /*
     * Enforce lowercase test names
     * Enforce it, test and describe to have descriptions that begin with a lowercase letter. This provides more readable test failures
     * https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/prefer-lowercase-title.md
     */
    'jest/prefer-lowercase-title': ['error', { ignore: ['describe'] }],

    /*
     * Disallow explicitly returning from tests.
     * Tests in Jest should be void and not return values.
     * If you are returning Promises then you should update the test to use async/await.
     * https://github.com/jest-community/eslint-plugin-jest/blob/master/docs/rules/no-test-return-statement.md
     */
    'jest/no-test-return-statement': 'error',

    /*
     * Suggest using jest.spyOn().
     * When mocking a function by overwriting a property you have to manually restore the original
     * implementation when cleaning up. When using jest.spyOn() Jest keeps track of changes, and they
     * can be restored with jest.restoreAllMocks(), mockFn.mockRestore() or by setting restoreMocks to
     * true in the Jest config.
     * https://github.com/jest-community/eslint-plugin-jest/blob/master/docs/rules/prefer-spy-on.md
     */
    'jest/prefer-spy-on': 'error',

    /*
     * Suggest using toStrictEqual().
     * toStrictEqual not only checks that two objects contain the same data but also that they have the
     * same structure. It is common to expect objects to not only have identical values but also to have
     * identical keys. A stricter equality will catch cases where two objects do not have identical keys.
     * https://github.com/jest-community/eslint-plugin-jest/blob/master/docs/rules/prefer-strict-equal.md
     */
    'jest/prefer-strict-equal': 'error',

    /*
     * Require a message for toThrow().
     * toThrow(), and its alias toThrowError(), are used to check if an error is thrown by a function call,
     * such as in expect(() => a()).toThrow(). However, if no message is defined, then the test will pass for
     * any thrown error. Requiring a message ensures that the intended error is thrown.
     * https://github.com/jest-community/eslint-plugin-jest/blob/master/docs/rules/require-to-throw-message.md
     */
    'jest/require-to-throw-message': 'error',

    /*
     * Enforce valid describe() callback.
     * Using an improper describe() callback function can lead to unexpected test errors.
     * https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/valid-describe-callback.md
     */
    'jest/valid-describe-callback': 'error',

    /*
     * Allow creating promises using the native `new Promise((resolve, reject) => ())`
     */
    'promise/avoid-new': 'off',

    /*
     * This rule is way too strict as discussed here for example:
     * https://github.com/nodesecurity/eslint-plugin-security/issues/22
     */
    'security/detect-object-injection': 'off',

    /*
     * This rule triggers A LOT of false positives to the extent of
     * actually immunizing against paying attention to this plugin at all
     * so we'd rather deactivate it
     */
    'security/detect-non-literal-fs-filename': 'off',

    /*
     * This rule is too aggressive, especially in tests where we often times want to be explicit with return strings we're testing.
     * https://github.com/SonarSource/eslint-plugin-sonarjs/blob/master/docs/rules/no-duplicate-string.md
     */
    'sonarjs/no-duplicate-string': 'off',

    /*
     * Enforce a specific parameter name in catch clauses.
     * Due to our custom regexp, the following error variables are ignored: _, _error, _error*
     * https://github.com/sindresorhus/eslint-plugin-unicorn/blob/master/docs/rules/catch-error-name.md
     */
    'unicorn/catch-error-name': [
      'error',
      { name: 'error', ignore: ['^_((error).*)?$'] },
    ],

    /*
     * Allow using 'null' as there can be legit use cases.
     * For example in react hooks it is customary to explicitly use 'null' instead of 'undefined' for empty values.
     * https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-null.md
     */
    'unicorn/no-null': 'off',

    /*
     * We don't like the `import fs from 'node:fs'` syntax so we turn it off
     * https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-node-protocol.md
     */
    'unicorn/prefer-node-protocol': 'off',

    /*
     * This rule is a bit too aggressive
     * https://github.com/sindresorhus/eslint-plugin-unicorn/blob/master/docs/rules/prevent-abbreviations.md
     */
    'unicorn/prevent-abbreviations': 'off',
  },
}
