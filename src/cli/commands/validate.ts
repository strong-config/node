/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-use-before-define */

import { Command, flags } from '@oclif/command'

import { Options } from '../../options'
import { validate as validateConfig } from '../../validate'
import { startSpinner, failSpinner, succeedSpinner } from '../spinner'

export default class Validate extends Command {
  static description = 'validate config files against a schema'

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
  }

  static args = [
    {
      name: 'config_path',
      description: 'path to an unencrypted config file',
      required: true,
    },
    {
      name: 'schema_path',
      description: 'path to a schema file',
      required: true,
    },
  ]

  static usage = 'validate CONFIG_PATH SCHEMA_PATH [--help]'

  static examples = [
    '$ validate config/development.yaml config/schema.json',
    '$ validate --help',
  ]

  async run() {
    const { args, flags } = this.parse(Validate)

    validate(args['config_path'], args['schema_path'], flags['verbose'])

    process.exit(0)
  }
}

export const validate = (
  configPath: string,
  schemaPath: string,
  isVerbose: boolean
): void => {
  startSpinner('Validating...')

  try {
    validateConfig([configPath], { schemaPath } as Options)
  } catch (error) {
    failSpinner('Config validation against schema failed', error, isVerbose)

    process.exit(1)
  }

  succeedSpinner('Validated!')
}
