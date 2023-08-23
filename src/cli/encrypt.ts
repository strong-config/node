#!/usr/bin/env node
import { Args, Command, Flags } from '@oclif/core'
import ora from 'ora'
import { getSopsOptions, runSopsWithOptions } from '../utils/sops'
import { defaultOptions } from '../options'
import { loadSchema } from './../utils/load-files'
import { validateOneConfigFile } from './validate'

export class Encrypt extends Command {
  static description = 'encrypt a config file'

  static strict = true

  static args = {
    config_file: Args.string({
      description:
        'path to a decrypted config file, for example: `strong-config encrypt config/production.yml`',
      required: true,
    }),
    output_path: Args.string({
      description:
        '[optionap] output file of the encrypted config. If not specified, CONFIG_FILE is overwritten in-place.',
      required: false,
    }),
  }

  static flags = {
    help: Flags.help({
      char: 'h',
      description: 'show help',
    }),
    'config-root': Flags.string({
      char: 'c',
      description:
        'your config folder containing your config files and optional schema',
      default: defaultOptions.configRoot,
    }),
    'key-provider': Flags.string({
      char: 'p',
      description: 'key provider to use to encrypt secrets',
      required: true,
      options: ['pgp', 'gcp', 'aws', 'azr'],
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
      default: 'Secret',
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
    'encrypt CONFIG_FILE [OUTPUT_PATH] --key-provider=KEY_PROVIDER --key-id=KEY_ID'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> config/development.yaml --key-provider gcp --key-id ref/to/key',
    '<%= config.bin %> <%= command.id %> config/production.yaml -p aws -k ref/to/key --unencrypted-key-suffix "Plain"',
  ]

  async encrypt(): Promise<void> {
    const { args, flags } = await this.parse(Encrypt)

    const spinner = ora('Encrypting...').start()

    const sopsOptions = ['--encrypt', ...getSopsOptions(args, flags)]

    try {
      runSopsWithOptions(sopsOptions)
    } catch (error) {
      spinner.fail('Failed to encrypt config file')

      if (
        typeof error === 'object' &&
        error !== null &&
        /* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
        // @ts-ignore - don't know how to make typescript happy here
        error.exitCode &&
        // @ts-ignore - don't know how to make typescript happy here
        error.exitCode === 203
      ) {
        console.error(
          `🤔 It looks like ${args.config_file} is already encrypted!\n`
        )
      }

      if (
        // @ts-ignore - don't know how to make typescript happy here
        error.stderr &&
        // @ts-ignore - don't know how to make typescript happy here
        typeof error.stderr === 'string' &&
        // @ts-ignore - don't know how to make typescript happy here
        error.stderr.includes('GCP')
      ) {
        // @ts-ignore - don't know how to make typescript happy here
        console.error(`🌩 Google Cloud KMS Error:\n${error.stderr as string}`)
      }
      /* eslint-enable @typescript-eslint/ban-ts-comment */

      console.error(error)
      process.exit(1)
    }

    spinner.succeed(`Successfully encrypted ${args.config_file}!`)
  }

  // All run() methods must return a Promise in oclif CLIs, regardless of whether they do something async or not.

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Encrypt)
    const configRoot = flags['config-root']

    const schema = loadSchema(configRoot)

    if (
      schema &&
      !validateOneConfigFile(args.config_file, configRoot, schema)
    ) {
      ora(
        `Encryption failed because ./${args.config_file} failed validation against ./${configRoot}/schema.json`
      ).fail()
      process.exit(1)
    }

    await this.encrypt()

    process.exit(0)
  }
}

export default Encrypt
