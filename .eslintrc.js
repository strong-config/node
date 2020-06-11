module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.eslint.json'],
    ecmaVersion: 2018,
    extraFileExtensions: ['.json'],
    sourceType: 'module',
  },
  ignorePatterns: [
    'tsconfig.json',
    'tsconfig.eslint.json',
    'example/types.d.ts',
  ],
  settings: {
    'import/resolver': {
      node: {
        paths: ['./src'],
      },
    },
  },
  plugins: ['@typescript-eslint', 'prettier', 'yaml', 'unicorn'],
  extends: [
    // https://eslint.org/docs/rules/
    'eslint:recommended',

    // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/src/configs/recommended.ts
    'plugin:@typescript-eslint/recommended',

    // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/src/configs/recommended-requiring-type-checking.ts
    'plugin:@typescript-eslint/recommended-requiring-type-checking',

    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/master/index.js#L8
    'plugin:unicorn/recommended',

    // https://github.com/benmosher/eslint-plugin-import/blob/master/config/recommended.js
    'plugin:import/recommended',

    // https://github.com/benmosher/eslint-plugin-import/blob/master/config/errors.js
    'plugin:import/errors',

    // https://github.com/benmosher/eslint-plugin-import/blob/master/config/warnings.js
    'plugin:import/warnings',

    // https://github.com/benmosher/eslint-plugin-import/blob/master/config/typescript.js
    'plugin:import/typescript',

    // https://github.com/azeemba/eslint-plugin-json/blob/master/src/index.js#L154-L158
    'plugin:json/recommended',

    // https://github.com/prettier/eslint-config-prettier/blob/master/%40typescript-eslint.js
    'prettier/@typescript-eslint',

    // https://github.com/prettier/eslint-config-prettier/blob/master/unicorn.js
    'prettier/unicorn',
  ],
  env: {
    jest: true,
  },
  rules: {
    /*
     * disallow nested ternary expressions
     * https://eslint.org/docs/rules/no-nested-ternary
     */
    'no-nested-ternary': 'error',

    /*
     * Disallows consecutive line comments in favor of block comments. Additionally,
     * requires block comments to have an aligned * character before each line.
     * https://eslint.org/docs/rules/multiline-comment-style
     */
    'multiline-comment-style': ['error', 'starred-block'],

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

    /*
     * if a let variable is never reassigned, use const instead of let
     * https://eslint.org/docs/rules/prefer-const
     */
    'prefer-const': 'error',

    /*
     * Require triple === and !==
     * https://eslint.org/docs/rules/eqeqeq
     */
    eqeqeq: ['error', 'always'],

    /*
     * Enforce default parameters to be last
     * https://eslint.org/docs/rules/default-param-last
     */
    'default-param-last': 'error',

    /*
     * Prevent abbreviations for maximum code readability
     * https://github.com/sindresorhus/eslint-plugin-unicorn/blob/master/docs/rules/prevent-abbreviations.md
     */
    'unicorn/prevent-abbreviations': [
      'error',
      {
        replacements: {
          args: false,
          ctx: false,
          dev: false,
          env: false,
          prop: false,
          props: false,
          ref: false,
        },
      },
    ],
    'import/order': 'error',
    'import/no-unresolved': ['error', {}],

    // Read this for the rationale: https://basarat.gitbook.io/typescript/main-1/defaultisbad
    'import/no-default-export': 'error',
  },
  reportUnusedDisableDirectives: true,
  globals: {
    __DEV__: true,
    __dirname: true,
    after: true,
    afterAll: true,
    afterEach: true,
    artifacts: true,
    before: true,
    beforeAll: true,
    beforeEach: true,
    console: true,
    describe: true,
    document: true,
    expect: true,
    global: true,
    Intl: true,
    it: true,
    jest: true,
    module: true,
    process: true,
    require: true,
    test: true,
    window: true,
    xdescribe: true,
    xit: true,
  },
}
