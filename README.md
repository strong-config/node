# 💪 strong-config

![Continuous Integration](https://github.com/strong-config/node/workflows/Continuous%20Integration%20Checks/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/strong-config/node/badge.svg?branch=master)](https://coveralls.io/github/strong-config/node?branch=master)

Simple, safe and secure config management for NodeJS. Based on [SOPS](https://github.com/mozilla/sops).

Have you ever struggled with different config values across local, CI,
and various environments? If not, did you ever forget to update the
production config after updating the local config? Have you ever been worried about
the secrecy of your DB credentials and API keys by taking the `.env` file approach?
Have you ever leaked confidential data by pushing secrets in your `.env` file
to the git remote?

If any of this has happened to you, **`strong-config` is here to help!**

`strong-config` allows you to:

- Structure configs hierarchically by writing JSON or YAML.
- Manage different configs for different environments.
- Protect your secrets by applying strong cryptography. Encrypt secrets at rest
  and automatically decrypt them at runtime by integrating a key management
  service (KMS), e.g. [AWS KMS](https://aws.amazon.com/kms/) or
  [Google Cloud KMS](https://cloud.google.com/kms/).
- Enforce permission models provided by your KMS. Decide who can encrypt
  and decrypt configs for which environments.
- Optionally validate configuration against a custom schema defined using
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

1. Create a first config file

   ```sh
   # inside your project
   mkdir config
   echo "someField: '💪'" > config/development.yaml
   ```

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

1. Run your app

   `strong-config` uses an environment variable to determine which config file
   to load. By default, this is `NODE_ENV`. Setting `NODE_ENV=development` will
   eventually load `development.yaml` from the config directory, which we created
   in step 2.

   ```sh
   # Set the environment variable
   export NODE_ENV=development

   # Start your app
   yarn start
   ```

   If you used our example code from the previous step, the config should now be
   printed to the terminal 💪.

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
  configRoot: 'config',
  runtimeEnvName: 'NODE_ENV',
  types: {
    rootTypeName: 'Config',
    filePath: 'types.d.ts',
  },
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
- **`configRoot`**: The path to the directory that contains one or multiple
  config files.

## Schema Validation

Besides writing config files, you can define a `schema.json` file which can be used
to validate your configs. The schema file must be written in JSON according to the
[`json-schema`](https://json-schema.org/) standard and be placed in the same directory
as your config files. To get started, you can have a look at the
[official learning resources](https://json-schema.org/learn/) or
checkout the examples in the `/example` directory of this project.

However, `strong-config` will work fine if you decide to not use schemas at all.

## CLI

`@strong-config/node` includes a CLI tool which is available in the terminal by
running `yarn strong-config` or `strong-config` (if you installed
`@strong-config/node` globally).

A primary use-case of the CLI tool is encrypting and validating configs. For example,
when you finished developing a feature that required config changes, you would
either encrypt the changed config through a git-hook or manually via
`strong-config encrypt <args>`.

The strong-config CLI supports three commands:

- **`encrypt <config> ...`**: Encrypt a config file with the passed arguments.
- **`decrypt <config> ...`**: Decrypt a config file with the passed arguments.
- **`validate <config> <schema>`**: Validate a config file against a schema file.

The available arguments and flags per command are shown with `--help`/`-h`.

## Integration with Cloud-based Key Management Services (KMS)

_Note: The following sections require familiarity with the provider-specific_
_IAMs and security models. Please make sure your keys are secured._

### [AWS KMS](https://aws.amazon.com/kms/)

You can use the [AWS console](https://console.aws.amazon.com/kms/) or the
[AWS CLI tool](https://docs.aws.amazon.com/cli) to create and manage keys. For
this walk-through, we will use the AWS console.

#### Create an AWS KMS Key

1. Sign-in to [https://console.aws.amazon.com/kms/](https://console.aws.amazon.com/kms/)
2. Navigate to _Customer managed keys_ (CMK)
3. Click _Create key_ (or select an existing key you wish to use for encryption)
4. Select _Symmetric_ as key type
5. Enter an alias and a description along with optional tags
6. Select key administrators
7. Select users and/or roles that can use the key for encryption and decryption
8. Review the key policy and click _Finish_

Now you should see the key under _Customer managed keys_.

#### Use an AWS KMS Key to encrypt your config

1. Click the key in the console to view the key details and copy the
   [Amazon Resource Name (ARN)](https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html)
   starting with `arn:aws:kms:...`.
2. Make sure that the current AWS credentials match the user/role you selected
   in step 7. You can use `aws configure` to set _Access Key ID_ and
   _Secret Access Key_ which are written to `~/.aws/credentials`.
3. Encrypt your config by running `strong-config encrypt <config> -p aws -k<arn>`
   , where `<arn>` refers to the ARN of your key.

Your config is now encrypted with the AWS KMS key 💪.

#### Use an AWS KMS Key to decrypt your config

The SOPS metadata contained in encrypted config includes details of the key ARN.
Thus, we only need to make sure that the current AWS credentials represent a
user/role that is permitted to use the key for decryption.

Decrypt your config by running `strong-config decrypt <config>`.

## FAQ

1. **Can I write my configs as JSON files?**

   Yes, YAML and JSON are supported. Please pay attention to the file extensions
   (`.yaml|yml` or `.json` are allowed).

1. **Do you support schemas other than [`json-schema`](https://json-schema.org/)?**

   No, currently we only support a schema based on `json-schema`.

1. **Can I use `@strong-config/node` for the browser, too?**

   No, single page applications (SPAs) are not suitable for containing secrets.
   This is because SPA code is delivered to the client and is therefore always public.

   Currently, `@strong-config/node` isn't suitable for browser use. However, we plan
   to provide `@strong-config/browser` in the future, which will address config
   management without secrets for SPAs.

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

These commands use an exemplary config setup in `/example`.
