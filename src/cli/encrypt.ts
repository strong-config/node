#!/usr/bin/env node
import { Command, flags as Flags } from '@oclif/command'
import ora from 'ora'
import { getSopsOptions, runSopsWithOptions } from '../utils/sops'
import { defaultOptions } from '../options'
import { loadSchema } from '../utils/read-files'
import { validate } from './validate'

const DEFAULT_ENCRYPTED_KEY_SUFFIX = 'Secret'
const SUPPORTED_KEY_PROVIDERS = ['pgp', 'gcp', 'aws', 'azr']

export class Encrypt extends Command {
  static description = 'encrypt config files'

  static strict = true

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

  static flags = {
    help: Flags.help({
      char: 'h',
      description: 'show help',
    }),
    'config-root': Flags.string({
      char: 'c',
      description:
        'your config folder containing your config files and optional schema.json',
      default: defaultOptions.configRoot,
    }),
    'key-provider': Flags.string({
      char: 'p',
      description: 'key provider to use to encrypt secrets',
      required: true,
      options: SUPPORTED_KEY_PROVIDERS,
      dependsOn: ['key-id'],
    }),
    'key-id': Flags.string({
      char: 'k',
      description: 'reference to a unique key managed by the key provider',
      required: true,
      dependsOn: ['key-provider'],
    }),
    'encrypted-key-suffix': Flags.string({
      char: 'e',
      description: 'key suffix determining the values to be encrypted',
      required: false,
      default: DEFAULT_ENCRYPTED_KEY_SUFFIX,
      exclusive: ['unencrypted-key-suffix'],
    }),
    'unencrypted-key-suffix': Flags.string({
      char: 'u',
      description: 'key suffix determining the values to be NOT encrypted',
      required: false,
      exclusive: ['encrypted-key-suffix'],
    }),
  }

  static usage =
    'encrypt CONFIG_FILE OUTPUT_PATH --key-provider=KEY_PROVIDER --key-id=KEY_ID [--[un]encrypted-key-suffix=SUFFIX] [--help]'

  static examples = [
    '$ encrypt config/development.yaml --key-provider gcp --key-id ref/to/key',
    '$ encrypt config/production.yaml -p aws -k ref/to/key --unencrypted-key-suffix "Plain"',
    '$ encrypt --help',
  ]

  encrypt = (): void => {
    const { args, flags } = this.parse(Encrypt)

    const spinner = ora('Encrypting...').start()

    const sopsOptions = ['--encrypt', ...getSopsOptions(args, flags)]

    try {
      runSopsWithOptions(sopsOptions)
    } catch (error) {
      spinner.fail('Failed to encrypt config file')

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- i don't know how to make this any safer for typescript
      if (error.exitCode && error.exitCode === 203) {
        console.error(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- can safely ignore this because the config_file arg is required
          `🤔 It looks like ${args.config_file} is already encrypted!\n`
        )
      }

      if (
        /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- i don't know how to make this any safer for typescript */
        error.stderr &&
        typeof error.stderr === 'string' &&
        error.stderr.includes('GCP')
      ) {
        console.error(`🌩 Google Cloud KMS Error:\n${error.stderr as string}`)
        /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
      }

      console.error(error)
      process.exit(1)
    }

    spinner.succeed(`Successfully encrypted ${args.config_file as string}!`)
  }

  run(): Promise<void> {
    const { args, flags } = this.parse(Encrypt)

    if (loadSchema(flags['config-root'])) {
      validate(args['config_file'], flags['config-root'])
    }

    this.encrypt()

    process.exit(0)
  }
}
