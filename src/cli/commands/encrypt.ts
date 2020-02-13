import { Command, flags } from '@oclif/command'

import {
  startSpinner,
  failSpinner,
  succeedSpinner,
  getVerbosityLevel,
} from '../spinner'
import { getSopsOptions, runSopsWithOptions } from '../../utils/sops'
import { readSchemaFile } from './../../utils/read-file'
import { validateCliWrapper } from './validate'
import defaultOptions from '../../options'

const DEFAULT_ENCRYPTED_KEY_SUFFIX = 'Secret'
const SUPPORTED_KEY_PROVIDERS = ['pgp', 'gcp', 'aws', 'azr']

const encrypt = (
  /* eslint-disable @typescript-eslint/no-explicit-any */
  args: Record<string, any>,
  flags: Record<string, any>
  /* eslint-enable @typescript-eslint/no-explicit-any */
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
      console.log(`🤔 It looks like ${args.config_file} is already encrypted`)
    }

    process.exit(1)
  }

  succeedSpinner(`Successfully encrypted ${args.config_file}!`)
}

export default class Encrypt extends Command {
  static description = 'encrypt config files'

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
  }

  static args = [
    {
      name: 'config_file',
      description:
        'path to an unencrypted config file, for example: `strong-config encrypt config/production.yml`',
      required: true,
    },
    {
      name: 'output_path',
      description:
        'output file of the encrypted config. If not specified, the file found at CONFIG_FILE is overwritten in-place.',
      required: false,
    },
  ]

  static usage =
    'encrypt CONFIG_FILE OUTPUT_PATH --key-provider=KEY_PROVIDER --key-id=KEY_ID [--[un]encrypted-key-suffix=SUFFIX] [--help]'

  static examples = [
    '$ encrypt config/development.yaml --key-provider gcp --key-id ref/to/key',
    '$ encrypt config/production.yaml -p aws -k ref/to/key --unencrypted-key-suffix "Plain"',
    '$ encrypt --help',
  ]

  /* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
  async run() {
    const { args, flags } = this.parse(Encrypt)

    if (readSchemaFile(flags['config-root'])) {
      validateCliWrapper(
        args['config_file'],
        flags['config-root'],
        getVerbosityLevel(flags.verbose)
      )
    }

    encrypt(args, flags)

    process.exit(0)
  }
}
