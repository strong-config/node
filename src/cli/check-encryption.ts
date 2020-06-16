#!/usr/bin/env node
import { Command, flags as Flags } from '@oclif/command'
import { pathExistsSync } from 'fs-extra'
import fastGlob from 'fast-glob'
import ora from 'ora'
import { defaultOptions } from '../options'
import type { EncryptedConfig, JSONObject } from '../types'
import { getFileFromPath } from '../utils/get-file-from-path'

export class CheckEncryption extends Command {
  static description = 'check that secrets in config files are safely encrypted'

  static strict = true

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
        '[optional] path to a specific config file to check. if omitted, all config files will be checked',
      required: false,
    },
  ]

  static usage = 'check-encryption [CONFIG_FILE] [--help]'

  static examples = [
    '$ check-encryption',
    '$ check',
    '$ check --config-root ./deeply/nested/config/folder',
    '$ check config/production.yaml',
    '$ check --help',
  ]

  static aliases = ['check']

  async checkAllConfigFiles(): Promise<void> {
    const spinner = ora('Checking all config files for encryption...').start()
    const { flags } = this.parse(CheckEncryption)

    const globPattern = `${flags['config-root']}/**/*.{yml,yaml}`
    const configFiles = await fastGlob(globPattern)

    if (configFiles.length === 0) {
      spinner.fail(`Found no config files in '${globPattern}'`)
      process.exit(1)
    }

    const checkResultsPerFile = configFiles.map((configPath) =>
      this.checkOneConfigFile(configPath)
    )

    if (checkResultsPerFile.includes(false)) {
      spinner.fail('Not all secrets are encrypted')
      process.exit(1)
    }

    spinner.succeed('Secrets in all config files are safely encrypted 💪')
  }

  checkOneConfigFile(path: string): boolean {
    const spinner = ora(`Checking ${path} for encryption...`).start()
    const { flags } = this.parse(CheckEncryption)

    if (!pathExistsSync(path)) {
      spinner.fail(
        `${path} doesn't exist.\nPlease either provide a valid path to a config file or don't pass any arguments to check all config files in '${flags['config-root']}'`
      )

      return false
    }

    const configFile = getFileFromPath(path)

    if (this.checkEncryption(configFile.contents)) {
      spinner.succeed(
        `Secrets in ${path} are safely encrypted 💪${
          flags.verbose
            ? `:\n${JSON.stringify(configFile.contents, undefined, 2)}`
            : ''
        }`
      )

      return true
    } else {
      spinner.fail(
        `Secrets in ${path} are NOT encrypted${
          flags.verbose
            ? `:\n${JSON.stringify(configFile.contents, undefined, 2)}`
            : ''
        }`
      )

      return false
    }
  }

  checkEncryption(configObject: JSONObject | EncryptedConfig): boolean {
    return Object.keys(configObject).includes('sops')
  }

  async run(): Promise<void> {
    const { args } = this.parse(CheckEncryption)

    if (args.config_file) {
      this.checkOneConfigFile(args.config_file)
        ? process.exit(0)
        : process.exit(1)
    } else {
      await this.checkAllConfigFiles()
    }

    process.exit(0)
  }
}