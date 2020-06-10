#!/usr/bin/env node
import { Command, flags as Flags } from '@oclif/command'

import {
  startSpinner,
  failSpinner,
  succeedSpinner,
  VerbosityLevel,
} from '../spinner'
import { validate } from '../../validate'
import { defaultOptions } from './../../options'

export const validateCliWrapper = (
  configFile: string,
  configRoot: string,
  verbosityLevel: VerbosityLevel = 1
): void => {
  startSpinner('Validating...')

  try {
    validate(configFile, configRoot)
  } catch (error) {
    failSpinner(
      'Config validation against schema failed',
      error,
      verbosityLevel
    )

    process.exit(1)
  }

  succeedSpinner('Config is valid!')
}

export default class Validate extends Command {
  static description = 'validate config files against a schema'

  static strict = true

  static flags = {
    'config-root': Flags.string({
      char: 'c',
      description:
        'your config folder containing your config files and optional schema.json',
      default: defaultOptions.configRoot,
    }),
    help: Flags.help({
      char: 'h',
      description: 'show help',
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'print stack traces in case of errors',
      default: false,
    }),
  }

  static args = [
    {
      name: 'config_file',
      description:
        'path to an unencrypted config file, for example `strong-config validate config/production.yml`',
      required: true,
    },
  ]

  static usage = 'validate CONFIG_FILE [--help]'

  static examples = ['$ validate config/development.yaml', '$ validate --help']

  run(): Promise<void> {
    const { args, flags } = this.parse(Validate)
    const verbosityLevel = flags.verbose ? 2 : 1

    validateCliWrapper(
      args['config_file'],
      flags['config-root'],
      verbosityLevel
    )

    process.exit(0)
  }
}
