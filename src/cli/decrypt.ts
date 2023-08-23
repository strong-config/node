#!/usr/bin/env node
import { Args, Command, Flags } from '@oclif/core'
import ora from 'ora'
import { getSopsOptions, runSopsWithOptions } from '../utils/sops'
import { loadSchema } from '../utils/load-files'
import { defaultOptions } from '../options'
import { validateOneConfigFile } from './validate'

export class Decrypt extends Command {
  static description = 'decrypt a config file'

  static strict = true

  static args = {
    config_file: Args.string({
      description:
        'path to an encrypted config file, for example: `strong-config decrypt config/production.yml`',
      required: true,
    }),
    output_path: Args.string({
      description:
        '[optional] output file of the decrypted config. If not specified, CONFIG_FILE is overwritten in-place.',
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
  }

  static usage = 'decrypt CONFIG_FILE [OUTPUT_PATH]'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> config/development.yaml',
    '<%= config.bin %> <%= command.id %> config/production.yaml config/production.decrypted.yaml',
  ]

  async decrypt() {
    const { args, flags } = await this.parse(Decrypt)

    const spinner = ora('Decrypting...').start()

    const sopsOptions = ['--decrypt', ...getSopsOptions(args, flags)]

    try {
      runSopsWithOptions(sopsOptions)
    } catch (error) {
      spinner.fail('Failed to decrypt config file')

      /* eslint-disable @typescript-eslint/ban-ts-comment */
      // @ts-ignore - don't know how to make typescript happy here
      if (error.exitCode) {
        /* istanbul ignore else: no need to test the else path */
        // @ts-ignore - don't know how to make typescript happy here
        if (error.exitCode === 1) {
          console.error(
            `🤔 It looks like ${args.config_file} is already decrypted`
          )
          // @ts-ignore - don't know how to make typescript happy here
        } else if (error.exitCode === 100) {
          console.error(
            `🤔 Didn't find ./${args.config_file}. A typo, perhaps?`
          )
        }
      } else {
        console.error(error)
      }
      /* eslint-enable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

      process.exit(1)
    }

    spinner.succeed(`Successfully decrypted ${args.config_file}!`)
  }

  // All run() methods must return a Promise in oclif CLIs, regardless of whether they do something async or not.
  async run(): Promise<void> {
    const { args, flags } = await this.parse(Decrypt)
    const configRoot = flags['config-root']
    await this.decrypt()

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

    process.exit(0)
  }
}

export default Decrypt
