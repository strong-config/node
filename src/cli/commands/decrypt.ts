import { Command, flags } from '@oclif/command'

import {
  startSpinner,
  failSpinner,
  succeedSpinner,
  getVerbosityLevel,
} from '../spinner'
import { getSopsOptions, runSopsWithOptions } from '../../utils/sops'
import { validateCliWrapper } from './validate'
import { readSchemaFile } from '../../utils/read-file'
import defaultOptions from '../../options'

const decrypt = (
  /* eslint-disable @typescript-eslint/no-explicit-any */
  args: Record<string, any>,
  flags: Record<string, any>
  /* eslint-enable @typescript-eslint/no-explicit-any */
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

    if (error.exitCode === 1) {
      console.log(`🤔 It looks like ${args.config_file} is already decrypted`)
    }

    process.exit(1)
  }

  succeedSpinner(`Successfully decrypted ${args.config_file}!`)
}

export default class Decrypt extends Command {
  static description = 'decrypt config files'

  static strict = true

  static flags = {
    help: flags.help({
      char: 'h',
      description: 'show help',
    }),
    'config-root': flags.string({
      char: 'c',
      description:
        'your config folder containing your config files and optional schema.json',
      default: defaultOptions.configRoot,
    }),
    verbose: flags.boolean({
      char: 'v',
      description: 'print stack traces in case of errors',
      default: false,
    }),
  }

  static args = [
    {
      name: 'config_file',
      description:
        'path to a decrypted config file, for example: `strong-config decrypt config/production.yml`',
      required: true,
    },
    {
      name: 'output_path',
      description:
        'output file of the decrypted config. If not specified, the file found at CONFIG_FILE is overwritten in-place.',
      required: false,
    },
  ]

  static usage = 'decrypt CONFIG_FILE OUTPUT_PATH [--help]'

  static examples = [
    '$ decrypt config/development.yaml',
    '$ decrypt config/production.yaml config/production.decrypted.yaml',
    '$ decrypt --help',
  ]

  async run(): Promise<void> {
    const { args, flags } = this.parse(Decrypt)

    decrypt(args, flags)

    if (readSchemaFile(flags['config-root'])) {
      validateCliWrapper(
        args['config_file'],
        flags['config-root'],
        getVerbosityLevel(flags.verbose)
      )
    }

    process.exit(0)
  }
}
