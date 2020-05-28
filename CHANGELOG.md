# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 0.2.16 (2020-05-28)

### 0.2.15 (2020-05-28)

### [0.2.8](https://github.com/strong-config/node/compare/v0.2.7...v0.2.8) (2020-05-25)

### [0.2.7](https://github.com/strong-config/node/compare/v0.2.6...v0.2.7) (2020-05-25)


### Features

* **sops:** also search in local directory for ‘sops’ binary if it isn’t found in global $PATH ([692a236](https://github.com/strong-config/node/commit/692a236717b766e7029a3f333a1933cbf5a62278))

### [0.2.6](https://github.com/strong-config/node/compare/v0.2.5...v0.2.6) (2020-05-20)

### [0.2.5](https://github.com/strong-config/node/compare/v0.2.4...v0.2.5) (2020-05-20)


### Features

* added postinstall script for automatically installing the needed ‘sops’ binary  ([652e2ea](https://github.com/strong-config/node/commit/652e2ea8c57e192a46b699330df05d60f1e50b2d))

### [0.2.4](https://github.com/strong-config/node/compare/v0.2.3...v0.2.4) (2020-05-19)


### Bug Fixes

* fixed missing typescript declarations ([21fa006](https://github.com/strong-config/node/commit/21fa0067cd847d40c1545604ee9e61d1b9287e9d))

### [0.2.3](https://github.com/strong-config/node/compare/v0.2.2...v0.2.3) (2020-05-19)


### Features

* **CLI:** new 'strong-config generate-types' command ([b5d93d8](https://github.com/strong-config/node/commit/b5d93d83436c584b528fb05abe6c9c2a22b3e10f))


### Bug Fixes

* **options:** fixed incorrect json schema for 'types' option ([97b1e40](https://github.com/strong-config/node/commit/97b1e40c56902bd468d786b96dd2f981fb76138c))

### [0.2.2](https://github.com/strong-config/node/compare/v0.2.1...v0.2.2) (2020-03-14)

### [0.2.1](https://github.com/strong-config/node/compare/v0.2.0...v0.2.1) (2020-02-19)


### Features

* **DX:** improved error message when process.env.NODE_ENV is undefined ([ca27d16](https://github.com/strong-config/node/commit/ca27d16a158f9f4e9645f7a9f4d2f282a66997de))
* **options:** renamed options.types.filePath to options.types.fileName to clarify that you should not pass a full path here (because the path always defaults to options.configRoot to keep the options simple) ([ba21ca7](https://github.com/strong-config/node/commit/ba21ca7ed46246d16bc353dcfa8e9658ea4c54e3))
* **schema validation:** support json-schema option ‘additionalProperties: false’ to allow stricter schema validations ([f79b798](https://github.com/strong-config/node/commit/f79b798e1c2c3284204571aa21821b47d1d11619))


### Bug Fixes

* **test:** fixed broken test resulting from deleting process.env.NODE_ENV and not properly restoring it after the test ([ef0e084](https://github.com/strong-config/node/commit/ef0e084a5c4eda9ae064b0cc2ed498878c8a654d))

## [0.2.0](https://github.com/strong-config/node/compare/v0.1.9...v0.2.0) (2020-02-14)


### ⚠ BREAKING CHANGES

* **schema:** schema-path is now hardcoded to ${options.configRoot}/schema.json and can no longer be customized
Before this commit we allowed passing a custom schema path via options.schemaPath that allowed placing the schema in arbitrary locations. While this did provide a little more flexibility, it also required extra code and added complexity. In the name of KISS we are now always defaulting the schema path to ${options.configRoot}/schema.json, which we feel is a sane default and should satisfy the vast majority (if not all) use cases.

### Features

* **schema:** simplify schema handling ([b04dad9](https://github.com/strong-config/node/commit/b04dad9c3fbbb41ad3433d96478fe669c9b4f324))

### [0.1.9](https://github.com/strong-config/node/compare/v0.1.8...v0.1.9) (2020-01-11)


### Bug Fixes

* **validation:** make schema validation disabled per default and explicit opt-in ([d7d3b19](https://github.com/strong-config/node/commit/d7d3b19750579a336f8c34d73add8e6c53cdf71a))

### [0.1.8](https://github.com/strong-config/node/compare/v0.1.6...v0.1.8) (2020-01-07)


### Features

* add CLI with encrypt and decrypt commands ([53559d6](https://github.com/strong-config/node/commit/53559d633133633ed88d1b9ca36fbe572e3d0090))


### Bug Fixes

* --verbose flag properly working for decrypt/encrypt CLI commands ([7049f5b](https://github.com/strong-config/node/commit/7049f5b6b578359cecc38f7fa40993beb3f1c41b))
* **encrypt:** remove parsing of verbosity level and handle as normal boolean ([b03f96c](https://github.com/strong-config/node/commit/b03f96cbfe0dd07e6ef06eee47aee118161c45f3))

### [0.1.7](https://github.com/strong-config/node/compare/v0.1.6...v0.1.7) (2019-11-27)

### [0.1.6](https://github.com/strong-config/node/compare/v0.1.5...v0.1.6) (2019-11-20)

### [0.1.5](https://github.com/strong-config/node/compare/v0.1.4...v0.1.5) (2019-11-19)


### Features

* **example project:** add dev:encrypt and dev:decrypt ([c6255cb](https://github.com/strong-config/node/commit/c6255cb))

### [0.1.4](https://github.com/strong-config/node/compare/v0.1.3...v0.1.4) (2019-11-18)

### [0.1.3](https://github.com/strong-config/node/compare/v0.1.2...v0.1.3) (2019-11-11)


### Bug Fixes

* set runtimeEnv and dev script terminal output ([9727284](https://github.com/strong-config/node/commit/9727284))


### Features

* store and validate parameters object that configures strong-config internally ([094de8f](https://github.com/strong-config/node/commit/094de8f))

### [0.1.2](https://github.com/strong-config/node/compare/v0.1.1...v0.1.2) (2019-10-15)

### [0.1.1](https://github.com/strong-config/node/compare/v0.1.0...v0.1.1) (2019-10-14)

## [0.1.0](https://github.com/strong-config/node/compare/v0.0.5...v0.1.0) (2019-10-11)


### ⚠ BREAKING CHANGES

* The exported class StrongConfig must be instantiated to
access load() and validate(). Both functions are not top-level exports
anymore

* export a class instead of two functions ([4c38caf](https://github.com/strong-config/node/commit/4c38caf))

### [0.0.5](https://github.com/strong-config/node/compare/v0.0.4...v0.0.5) (2019-10-09)


### Features

* implement and expose validate ([5639e39](https://github.com/strong-config/node/commit/5639e39))

### 0.0.4 (2019-10-06)


### Features

* initial setup of typescript project with tsconfig, prettier and ([9273e4d](https://github.com/strong-config/node/commit/9273e4d))
* migrate existing strong-config ([2073f91](https://github.com/strong-config/node/commit/2073f91))

### 0.0.3 (2019-10-04)


### Features

* initial setup of typescript project with tsconfig, prettier and ([9273e4d](https://github.com/strong-config/node/commit/9273e4d))
* migrate existing strong-config ([2073f91](https://github.com/strong-config/node/commit/2073f91))

### 0.0.2 (2019-10-04)


### Features

* initial setup of typescript project with tsconfig, prettier and ([9273e4d](https://github.com/strong-config/node/commit/9273e4d))
* migrate existing strong-config ([2073f91](https://github.com/strong-config/node/commit/2073f91))
