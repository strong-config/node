# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.2.54](https://github.com/strong-config/node/compare/v0.2.52...v0.2.54) (2021-01-12)


### Features

* **check-encryption:** allow passing multiple config file arguments ([42c1fad](https://github.com/strong-config/node/commit/42c1fad4c1a42b88d20680ef596b21fd25cf9536))
* **core:** improved error message when passing invalid options to strong-config ([0bed908](https://github.com/strong-config/node/commit/0bed908c7115e295c0d792202bb8963fae118404))
* **validate:** allow passing multiple config file arguments ([81d0578](https://github.com/strong-config/node/commit/81d0578c04338464c11f8a7d66a8e8caea93e3b8))

### [0.2.53](https://github.com/strong-config/node/compare/v0.2.52...v0.2.53) (2021-01-08)


### Features

* **check-encryption:** allow passing multiple config file arguments ([0c4967c](https://github.com/strong-config/node/commit/0c4967c94a015213542a2d10b86847256ff96949))
* **validate:** allow passing multiple config file arguments ([fba3501](https://github.com/strong-config/node/commit/fba35010fb45f995637efd90f7773b951b50bbae))

### [0.2.52](https://github.com/strong-config/node/compare/v0.2.51...v0.2.52) (2020-12-29)


### Bug Fixes

* **check-encryption:** improve 'strong-config check' to also detect deeply nested secrets ([711c7e7](https://github.com/strong-config/node/commit/711c7e77b2b659c07e6bc73af06df7abf1f7910a))

### [0.2.51](https://github.com/strong-config/node/compare/v0.2.50...v0.2.51) (2020-12-29)

### [0.2.50](https://github.com/strong-config/node/compare/v0.2.49...v0.2.50) (2020-09-14)

### [0.2.49](https://github.com/strong-config/node/compare/v0.2.48...v0.2.49) (2020-09-03)

### [0.2.48](https://github.com/strong-config/node/compare/v0.2.47...v0.2.48) (2020-07-30)

### [0.2.47](https://github.com/strong-config/node/compare/v0.2.46...v0.2.47) (2020-07-30)

### [0.2.46](https://github.com/strong-config/node/compare/v0.2.45...v0.2.46) (2020-07-30)

### [0.2.45](https://github.com/strong-config/node/compare/v0.2.44...v0.2.45) (2020-07-29)


### Features

* **validate:** display better error messages on validation errors ([1e89a03](https://github.com/strong-config/node/commit/1e89a037d0c42549276b61e82682467a14804478))

### [0.2.44](https://github.com/strong-config/node/compare/v0.2.43...v0.2.44) (2020-07-29)


### Features

* **options:** make type-generation option a simple boolean option ([9d0626b](https://github.com/strong-config/node/commit/9d0626bae84404d312d3633002ae9dd5dbe38e3a))
* **validate:** allow ‘validate’ cli command to operate on either ONE or ALL config files (was previously just possible for one file at a time) ([514303f](https://github.com/strong-config/node/commit/514303f25e2b24c90e035e76c88125da1339b7fb))


### Bug Fixes

* **checkEncryption:** fixed overly cautious CLI ‘check’ command that would fail for a config file that didn’t even contain any secrets ([15f3c3f](https://github.com/strong-config/node/commit/15f3c3fcbe2090087f9a202b7360b433f0de2e4a))

### [0.2.43](https://github.com/strong-config/node/compare/v0.2.42...v0.2.43) (2020-07-22)

### [0.2.42](https://github.com/strong-config/node/compare/v0.2.41...v0.2.42) (2020-07-10)


### Features

* **options:** removed ‘substitionPattern’ from options ([3021725](https://github.com/strong-config/node/commit/3021725c2665e884f0388cd406b1b56f98d4761a))
* stricter env var substitution checks and tests ([8cfa45f](https://github.com/strong-config/node/commit/8cfa45f5dc282a7a79146edf28cb469325d80c6a))

### [0.2.41](https://github.com/strong-config/node/compare/v0.2.40...v0.2.41) (2020-06-26)

### [0.2.40](https://github.com/strong-config/node/compare/v0.2.39...v0.2.40) (2020-06-25)

### [0.2.39](https://github.com/strong-config/node/compare/v0.2.38...v0.2.39) (2020-06-25)


### Features

* **core:** check for existence of process.env.NODE_ENV in constructor ([a5dfa68](https://github.com/strong-config/node/commit/a5dfa681de6ab957fe482620b015bd2d8c2e88ac))

### [0.2.38](https://github.com/strong-config/node/compare/v0.2.37...v0.2.38) (2020-06-23)

### [0.2.37](https://github.com/strong-config/node/compare/v0.2.36...v0.2.37) (2020-06-23)


### Features

* removed —verbose flag from ‘check’ and ‘generate-types’ commands ([2847cc4](https://github.com/strong-config/node/commit/2847cc4f959c0387196a50f62380b4f1c555be75))

### [0.2.36](https://github.com/strong-config/node/compare/v0.2.35...v0.2.36) (2020-06-22)

### [0.2.35](https://github.com/strong-config/node/compare/v0.2.34...v0.2.35) (2020-06-19)


### Bug Fixes

* **CI:** fix manifest generation (at least locally) ([dd23f35](https://github.com/strong-config/node/commit/dd23f35fb99e5b06d7839113925352cd63eff8a5))

### [0.2.34](https://github.com/strong-config/node/compare/v0.2.33...v0.2.34) (2020-06-19)

### [0.2.33](https://github.com/strong-config/node/compare/v0.2.32...v0.2.33) (2020-06-19)


### Bug Fixes

* **CI:** also need to run tests with --coverage flag in CI to generate the necessary coverage reports for coveralls ([ca77925](https://github.com/strong-config/node/commit/ca77925678714af93e6c1370724d80e272aad8e5))
* **CI:** fixed wrongly named ‘yarn clean’ task that broke the release job in CI ([44d5760](https://github.com/strong-config/node/commit/44d576010c2bb124fede03050464cb76d3e83915))

### [0.2.32](https://github.com/strong-config/node/compare/v0.2.31...v0.2.32) (2020-06-10)


### Features

* **debug:** added ‘debug’ package and some debugging output ([d5e7add](https://github.com/strong-config/node/commit/d5e7add6aaa26222e5f90d7878167676f46368ba))


### Bug Fixes

* **validate:** re-add accidentally deleted error to catch statement ([a85a8b4](https://github.com/strong-config/node/commit/a85a8b492f2203a5a3dda2132f64ca784f14b54e))

### [0.2.31](https://github.com/strong-config/node/compare/v0.2.30...v0.2.31) (2020-06-02)


### Features

* **cli:** added “yarn check-encrypt” (alias: “yarn check”) command to ensure that config files are encrypted ([477a04c](https://github.com/strong-config/node/commit/477a04c08f1b3a2f9446ef56194980be01c8fc5a))


### Bug Fixes

* unignore example files to add new config-fixture required by tests ([98405d6](https://github.com/strong-config/node/commit/98405d608f089ae65979f899d0ffec5d74923b2d))

### [0.2.30](https://github.com/strong-config/node/compare/v0.2.29...v0.2.30) (2020-06-02)


### Features

* **encrypt:** small error handling improvements when using sops with GCP KMS as the key provider ([82eed6b](https://github.com/strong-config/node/commit/82eed6b4e4d5f017d124a14cbe443d344770072a))

### [0.2.29](https://github.com/strong-config/node/compare/v0.2.28...v0.2.29) (2020-06-02)


### Bug Fixes

* **ci:** manifest generation actually needs to happen POSTrelease as it depends on an up-to-date version number which is bumped in the release-step ([fd3864b](https://github.com/strong-config/node/commit/fd3864bb177a9b034d17d4e4fd91c7ee0eba31ae))

### [0.2.28](https://github.com/strong-config/node/compare/v0.2.27...v0.2.28) (2020-06-02)


### Bug Fixes

* **ci:** include oclif manifest in files-array in package.json so it will not only be available in development mode ([1a8504d](https://github.com/strong-config/node/commit/1a8504dfaee02705d1b58981bfda1faa7004bb80))

### [0.2.27](https://github.com/strong-config/node/compare/v0.2.26...v0.2.27) (2020-06-02)


### Bug Fixes

* **ci:** also commit oclif.manifest.json during auto-release process ([10e06b4](https://github.com/strong-config/node/commit/10e06b4c9eaf2e8193341b133feda9b1b2aa83f5))

### [0.2.26](https://github.com/strong-config/node/compare/v0.2.25...v0.2.26) (2020-06-02)

### [0.2.25](https://github.com/strong-config/node/compare/v0.2.24...v0.2.25) (2020-06-02)


### Bug Fixes

* **setup:** added postinstall.js to files-array in package.json to include it in the production build of the package ([33a6250](https://github.com/strong-config/node/commit/33a62505eef86864d44c65da60bd636ac3715e9a))

### [0.2.24](https://github.com/strong-config/node/compare/v0.2.15...v0.2.24) (2020-05-29)


### Features

* **sops:** refactor postinstall script to javascript to simplify using it in the same way everywhere (e.g. local dev, from another package, in CI..) ([a2f813f](https://github.com/strong-config/node/commit/a2f813fa55e83484893ea5b91916a01eeaa95bcc))


### Bug Fixes

* **sops:** retain *.exe file extension when downloading sops on windows systems ([4389fc4](https://github.com/strong-config/node/commit/4389fc413609846719f3e79762800da12d31752d))

### 0.2.23 (2020-05-29)

### 0.2.22 (2020-05-29)

### 0.2.21 (2020-05-28)

### [0.2.20](https://github.com/strong-config/node/compare/v0.2.15...v0.2.20) (2020-05-28)

### 0.2.19 (2020-05-28)

### 0.2.18 (2020-05-28)

### 0.2.17 (2020-05-28)

### 0.2.16 (2020-05-28)

### [0.2.15](https://github.com/strong-config/node/compare/v0.2.6...v0.2.15) (2020-05-27)


### Features

* **sops:** also search in local directory for ‘sops’ binary if it isn’t found in global $PATH ([692a236](https://github.com/strong-config/node/commit/692a236717b766e7029a3f333a1933cbf5a62278))
* **sops:** improved error handling when sops gets a permission-denied error ([ea5780c](https://github.com/strong-config/node/commit/ea5780c774ad08bb5574c443999ec5d089da8ea6))


### Bug Fixes

* **security:** fixed vulnerabilities in devDependencies ([bebcedc](https://github.com/strong-config/node/commit/bebcedc376b10676e728b4a182ddec57b9914ea1))
* use async versions of ‘fs’ functions to not freeze CLI spinners when running sops-install script ([73a24ae](https://github.com/strong-config/node/commit/73a24ae28abbcfc65e3b7d6306a4a2dbbe3d1dea))



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
