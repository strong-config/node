# 💪 strong-config

<!-- markdownlint-disable line-length -->

[![pipeline status](https://git.brickblock.sh/devops/strong-config-ts-mirror/badges/master/pipeline.svg)](https://git.brickblock.sh/devops/strong-config-ts-mirror/commits/master) [![coverage report](https://git.brickblock.sh/devops/strong-config-ts-mirror/badges/master/coverage.svg)](https://git.brickblock.sh/devops/strong-config-ts-mirror/commits/master)

<!-- markdownlint-enable line-length -->

Simple, safe and secure config management for NodeJS. Based on [SOPS](https://github.com/mozilla/sops).

Have you ever struggled with different config values across local, CI,
and various environments? If not, did you ever forget to update the
production config after updating the local config? Have you ever been worried about
the secrecy of your DB credentials and API keys by taking the `.env` file approach?
Have you ever leaked confidential data by pushing secrets in your `.env` file
to the git remote?

If any of this has happened to you, **`strong-config` is here to help!**

- Structure configs hierarchically by writing JSON or YAML.
- Manage different configs for different environments.
- Protect your secrets by applying strong cryptography. Encrypt secrets at rest
  and automatically decrypt them at runtime by integrating a key management
  service (KMS), e.g. [AWS KMS](https://aws.amazon.com/kms/) or
  [Google Cloud KMS](https://cloud.google.com/kms/).
- Enforce arbitrary permission models provided by your KMS. Decide who can encrypt
  and decrypt configs for which environments.
- Optionally validate them against a custom schema using
  [`json-schema`](https://json-schema.org/). Also in CI.
- Safeguard your configs by using git hooks. Make sure the configs are both
  valid and encrypted before committing and pushing them.
- Autogenerate Typescript types based on your schema.

## Example

Here is how an encrypted config file containing secrets looks like:

```yml
logger:
  level: DEBUG
auth:
  url: my-auth-url
  myApiKeySecret: ENC[AES256_GCM,data:aeQ+hlVIah7WyJoVR/Jbkb6GLH7ihsV0D81+U++pkiWD0zeoRL/Oe9Q3Tz6j/TNvKKVDnohIMyw3UVjELOuSY+A==,iv:nVRZWogV4B7o=,tag:KrE2jssfP4uCvqq+pc/JyQ==,type:str]
sops:
  gcp_kms:
    - resource_id: projects/my-project/locations/europe-west3/keyRings/my-project-key-ring/cryptoKeys/my-strong-config-key
      created_at: '2019-11-07T10:11:12Z'
      enc: AiAAmdAgjOdw1XdV2MsDpvmZ4Deo867hmcX2B3DNhe2BCF2axuZ18hJJFK9oBlE1BrD70djwqi+L8T+NRNVnGUP+1//w8cJATAfJ8W/cQZFcdFTqjezC+VYv9xYI8i1bRna4xfFo/INIJtFDR38ZH1nrQg==
  lastmodified: '2019-11-07T10:11:12Z'
  mac: ENC[AES256_GCM,data:ABcd1EF2gh3IJKl4MNOpQr5stuvWXYz6sBCDEfGhIjK=,iv:A1AaAAAaa111a1Aa111AA/aaaAaaAAaa+aAaAaAAAaA=,tag:AAaaA1a1aaaAa/aa11AaaA==,type:str]
  encrypted_suffix: Secret
  version: 3.4.0
```

The field `sops` contains a set of metadata provided context information and
important details to decrypt this config at runtime. Never delete this field
or make changes to the encrypted file without using `@strong-config` - it will
leave you with a corrupted config.

## How-to

Please backup your existing configs and secrets.

1. Install `@strong-config/node` and the SOPS binary.

   ```sh
   npm install @strong-config/node
   # or
   yarn add @strong-config/node
   ```

   SOPS is [available for all major systems](https://github.com/mozilla/sops/releases).
   If you are on Mac, you can install SOPS by running `brew install sops`.

1. Define runtime environment and create first config file

   ```sh
   export NODE_ENV=development # or similar, depending on your shell

   # inside your project
   mkdir config
   echo "someField: '💪'" > config/development.yaml
   ```

   `strong-config` uses an environment variable to determine which config file
   to load. By default, this is `NODE_ENV`. Setting `NODE_ENV=development` will
   eventually load `development.yaml` from the config directory.

1. Import and use `strong-config` in code

   ```js
   // index.js, or anywhere you need config values

   // ES6-style import. Commonjs is supported too
   import StrongConfig from '@strong-config/node'

   // Decrypts and loads config
   const config = new StrongConfig().load()

   console.log(config)
   // --> { someField: '💪' }
   ```

   The first invocation of `load()` dynamically generates types for Typescript and
   saves them to `./strong-config.d.ts`. If you do not use Typescript, feel
   free to delete it and disable type generation completely (see [Customization](#customization)).

## Customization

`strong-config` can be customized to your needs. Out of the box, sensible
defaults are used. However, these can be easily overwritten by passing an
`options`-object to the class contructor:

```js
const strongConfig = new StrongConfig(<options>)
```

The available options and their defaults are:

```js
{
  runtimeEnvName: 'NODE_ENV',
  types: {
    rootTypeName: 'Config',
    filePath: 'strong-config.d.ts',
  },
  substitutionPattern: '\\$\\{(\\w+)\\}',
  configPath: 'config/',
  schemaPath: 'config/schema.json',
}
```

Let's have a closer look.

- **`runtimeEnvName`**: The name of the environment variable that determines which
  config to load. For example, when we set `NODE_ENV=dev`, strong-config tries load
  `<configDir>/dev.{yaml|yml|json}`.
- **`types`**: Block containing options to customize the type generation. If you
  don't want to generate types, overwrite this block with `types: false`.
      - **`rootTypeName`**: The interface name you can import in your code. This
        interface type describes the entire structure of your config based on the
        schema file you provide.
      - **`filePath`**: The desired path of the output type file.
- **`substitutionPattern`**: Substitutions allow you to include variables of
  your execution environment in the config. For example, assignments like
  `key: ${MY_VALUE}` in your config file can be substituted at runtime, resulting
  in `key: process.env['MY_VALUE']`. The `substitutionPattern` is an escaped
  regexp string that determines the format of substituted values in your config.
  In the given example and by default, this is of form `${<my-var>}`.
- **`configPath`**: The path to the directory that contains one or multiple
  config files.
- **`schemaPath`**: The path the schema file that contains valid
  [`json-schema`](https://json-schema.org/).

## Schema Validation

Besides writing config files, you can define a schema file which can be used
to validate your configs. The schema file must be written in JSON according to the
[`json-schema`](https://json-schema.org/) standard. To get started, you can have
a look at the [official learning resources](https://json-schema.org/learn/) or
checkout the examples in the `/example` directory of this project.

You can provide the path to your schema file via `options.schemaPath`. Please
note that this file must be named `schema.json` if you decide to place it in
the same directory as your config files (which is the default).

However, `strong-config` will work fine if you decide to not use schemas at all.

## FAQ

1. **Can I write my configs as JSON files?**

   Yes, YAML and JSON are supported. Please pay attention to the file extensions
   (`.yaml|yml` or `.json` are allowed).

1. **Do you support schemas other than [`json-schema`](https://json-schema.org/)?**

   No, currently we only support a schema based on `json-schema`.

1. **Can I use `@strong-config/node` for the browser, too?**

   No, single page applications (SPAs) are not suitable for containing secrets.
   This is because SPA code is delivered to the client and is therefore always public.
   TODO: explain what you can do when your configs don't have secrets.

1. **Can I use `@strong-config/node` for Server-Side-Rendered (SSR) apps, too?**

   It depends. The server-side can make use of `@strong-config/node` to manage
   secrets. However, the client-side can't because of the reason in the previous
   point.

1. **Can my config contain arrays?**

   Yes, but not as top-level definition. The top-level of any config file must be
   an object so SOPS can store its metadata in the field `sops`. Otherwise, you
   can define arrays at any nested level of the config file.

## Development and Contributions

We added a few scripts (under `/scripts/dev` with entrypoints in `package.json`)
for development purposes:

- `yarn dev:load`/`yarn dev:load:es6`, and `yarn dev:load:commonjs`
- `yarn dev:validate`

These use an exemplary config setup in `/example`.

Our contribution guidelines are posted in `CONTRIBUTING.md`
