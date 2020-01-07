/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-use-before-define, @typescript-eslint/no-explicit-any */

import { Command, flags } from '@oclif/command'

import {
  startSpinner,
  failSpinner,
  succeedSpinner,
  getVerbosityLevel,
} from '../spinner'
import { getSopsOptions, runSopsWithOptions } from '../../utils/sops'
import { validate } from './validate'

const DEFAULT_ENCRYPTED_KEY_SUFFIX = 'Secret'
const SUPPORTED_KEY_PROVIDERS = ['pgp', 'gcp', 'aws', 'azr']

export default class Encrypt extends Command {
  static description = 'encrypt config files'

  static strict = true

  static flags = {
    help: flags.help({
      char: 'h',
      description: 'show help',
    }),
    verbose: flags.boolean({
      char: 'v',
      description: 'print stack traces in case of errors',
      default: false,
    }),
    'key-provider': flags.string({
      char: 'p',
      description: 'key provider to use to encrypt secrets',
      required: true,
      options: SUPPORTED_KEY_PROVIDERS,
      dependsOn: ['key-id'],
    }),
    'key-id': flags.string({
      char: 'k',
      description: 'reference to a unique key managed by the key provider',
      required: true,
      dependsOn: ['key-provider'],
    }),
    'encrypted-key-suffix': flags.string({
      char: 'e',
      description: 'key suffix determining the values to be encrypted',
      required: false,
      default: DEFAULT_ENCRYPTED_KEY_SUFFIX,
      exclusive: ['unencrypted-key-suffix'],
    }),
    'unencrypted-key-suffix': flags.string({
      char: 'u',
      description: 'key suffix determining the values to be NOT encrypted',
      required: false,
      exclusive: ['encrypted-key-suffix'],
    }),
    'schema-path': flags.string({
      char: 's',
      description:
        'path to the schema against which the config will be validated against prior to encryption. If not specified, validation is skipped.',
      required: false,
    }),
  }

  static args = [
    {
      name: 'config_path',
      description:
        'path to an unencrypted config file, for example: `strong-config encrypt ./config/production.yml`',
      required: true,
    },
    {
      name: 'output_path',
      description:
        'output file of the encrypted config. If not specified, the file found at CONFIG_PATH is overwritten in-place.',
      required: false,
    },
  ]

  static usage =
    'encrypt CONFIG_PATH OUTPUT_PATH --key-provider=KEY_PROVIDER --key-id=KEY_ID [--[un]encrypted-key-suffix=SUFFIX] [--schema-path=SCHEMA_PATH] [--help]'

  static examples = [
    '$ encrypt config/development.yaml --key-provider gcp --key-id ref/to/key',
    '$ encrypt config/production.yaml -p aws -k ref/to/key --unencrypted-key-suffix "Plain" --schema-path config/schema.json',
    '$ encrypt --help',
  ]

  async run() {
    const { args, flags } = this.parse(Encrypt)

    // Validate unencrypted config prior to encryption
    if (flags['schema-path']) {
      validate(
        args['config_path'],
        flags['schema-path'],
        getVerbosityLevel(flags.verbose)
      )
    }

    encrypt(args, flags)

    process.exit(0)
  }
}

const encrypt = (
  args: Record<string, any>,
  flags: Record<string, any>
): void => {
  startSpinner('Encrypting...')

  const sopsOptions = ['--encrypt', ...getSopsOptions(args, flags)]

  try {
    runSopsWithOptions(sopsOptions)
  } catch (error) {
    failSpinner(
      'Failed to encrypt config file',
      error,
      getVerbosityLevel(flags.verbose)
    )

    if (error.exitCode === 203) {
      console.log(`🤔 It looks like ${args.config_path} is already encrypted`)
    }

    process.exit(1)
  }

  succeedSpinner(`Successfully encrypted ${args.config_path}!`)
}
