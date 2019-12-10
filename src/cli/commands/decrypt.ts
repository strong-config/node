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

export default class Decrypt extends Command {
  static description = 'decrypt config files'

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
    'schema-path': flags.string({
      char: 's',
      description:
        'path to the schema against which the config will be validated against after decryption. If not specified, validation is skipped. If the schma path is set, the command fails if the encryption succeeded but the validation fails',
      required: false,
    }),
  }

  static args = [
    {
      name: 'config_path',
      description: 'path to an encrypted config file',
      required: true,
    },
    {
      name: 'output_path',
      description:
        'output file of the decrypted config. If not specified, the file found at CONFIG_PATH is overwritten in-place.',
      required: false,
    },
  ]

  static usage =
    'decrypt CONFIG_PATH OUTPUT_PATH [--schema-path=SCHEMA_PATH] [--help]'

  static examples = [
    '$ decrypt config/development.yaml',
    '$ decrypt config/production.yaml config/production.decrypted.yaml --schema-path config/schema.json',
    '$ decrypt --help',
  ]

  async run() {
    const { args, flags } = this.parse(Decrypt)

    decrypt(args, flags)

    // Validate unencrypted config after decryption
    if (flags['schema-path']) {
      validate(
        args['config_path'],
        flags['schema-path'],
        getVerbosityLevel(flags.verbose)
      )
    }

    process.exit(0)
  }
}

const decrypt = (
  args: Record<string, any>,
  flags: Record<string, any>
): void => {
  startSpinner('Decrypting...')

  const sopsOptions = ['--decrypt', ...getSopsOptions(args, flags)]

  try {
    runSopsWithOptions(sopsOptions)
  } catch (error) {
    failSpinner(
      'Failed to decrypt config file',
      error,
      getVerbosityLevel(flags.verbose)
    )

    process.exit(1)
  }

  succeedSpinner('Decrypted!')
}
