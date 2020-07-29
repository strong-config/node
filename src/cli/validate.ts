#!/usr/bin/env node
import { Command, flags as Flags } from '@oclif/command'
import Ajv from 'ajv'
import ora from 'ora'
import { defaultOptions } from '../options'
import { loadSchema, loadConfigFromPath } from '../utils/load-files'
import * as sops from '../utils/sops'
import { DecryptedConfig } from '../types'

export const validate = (configPath: string, configRoot: string): void => {
  const spinner = ora('Validating...').start()
  const ajv = new Ajv({ allErrors: true, useDefaults: true })

  try {
    spinner.text = `Loading config: ${configPath}`
    spinner.render()
    const configFile = loadConfigFromPath(configPath)

    spinner.text = `Decrypting config with sops...`
    spinner.render()
    const decryptedConfig: DecryptedConfig = sops.decryptToObject(
      configFile.filePath,
      configFile.contents
    )

    spinner.text = `Loading schema from: ${configRoot}`
    spinner.render()
    const schema = loadSchema(configRoot)

    if (!schema) {
      spinner.fail(`No schema file found in: ${configRoot}`)
      process.exit(1)
    }

    if (!ajv.validate(schema, decryptedConfig)) {
      spinner.fail(
        `Config validation against schema failed:\n${ajv.errorsText()}`
      )
      process.exit(1)
    }

    spinner.text = 'Validating config against schema...'
    spinner.render()
  } catch (error) {
    spinner.fail(`Config validation against schema failed`)
    console.error(error)
    process.exit(1)
  }

  spinner.succeed('Config is valid!')
}

export class Validate extends Command {
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

    validate(args['config_file'], flags['config-root'])

    process.exit(0)
  }
}
