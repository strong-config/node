#!/usr/bin/env node
import { Command, flags as Flags } from '@oclif/command'
import ora from 'ora'
import { getSopsOptions, runSopsWithOptions } from '../utils/sops'
import { loadSchema } from '../utils/load-files'
import { defaultOptions } from '../options'
import { validateOneConfigFile } from './validate'

export class Decrypt extends Command {
  static description = 'decrypt a config file'

  static strict = true

  static args = [
    {
      name: 'config_file',
      description:
        'path to an encrypted config file, for example: `strong-config decrypt config/production.yml`',
      required: true,
    },
    {
      name: 'output_path',
      description:
        '[optional] output file of the decrypted config. If not specified, CONFIG_FILE is overwritten in-place.',
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
        'your config folder containing your config files and optional schema',
      default: defaultOptions.configRoot,
    }),
  }

  static usage = 'decrypt CONFIG_FILE [OUTPUT_PATH]'

  static examples = [
    '$ decrypt config/development.yaml',
    '$ decrypt config/production.yaml config/production.decrypted.yaml',
    '$ decrypt --help',
  ]

  decrypt = (): void => {
    const { args, flags } = this.parse(Decrypt)

    const spinner = ora('Decrypting...').start()

    const sopsOptions = ['--decrypt', ...getSopsOptions(args, flags)]

    try {
      runSopsWithOptions(sopsOptions)
    } catch (error) {
      spinner.fail('Failed to decrypt config file')

      /* eslint-disable @typescript-eslint/restrict-template-expressions -- oclif's types are too weak, config_file arg is always required */
      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- i don't know how to properly type the error object :/ */
      if (error.exitCode) {
        /* istanbul ignore else: no need to test the else path */
        if (error.exitCode === 1) {
          console.error(
            `🤔 It looks like ${args.config_file} is already decrypted`
          )
        } else if (error.exitCode === 100) {
          console.error(
            `🤔 Didn't find ./${args.config_file}. A typo, perhaps?`
          )
        }
      } else {
        console.error(error)
      }
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      /* eslint-enable @typescript-eslint/restrict-template-expressions */

      process.exit(1)
    }

    spinner.succeed(`Successfully decrypted ${args.config_file as string}!`)
  }

  run(): Promise<void> {
    this.decrypt()

    const { args, flags } = this.parse(Decrypt)
    const schema = loadSchema(flags['config-root'])

    if (schema && !validateOneConfigFile(args.config_file, schema)) {
      ora(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Encryption failed because ./${args.config_file} failed validation against ./${flags['config-root']}/schema.json`
      ).fail()
      process.exit(1)
    }

    process.exit(0)
  }
}
