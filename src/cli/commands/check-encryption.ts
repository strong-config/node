#!/usr/bin/env node
import { Command, flags as Flags } from '@oclif/command'
import type { JSONObject, EncryptedConfig } from './../../types'
import { getFileFromPath } from '../../utils/get-file-from-path'
import { pathExistsSync } from 'fs-extra'
import fastGlob from 'fast-glob'
import defaultOptions from '../../options'
import {
  startSpinner,
  failSpinner,
  succeedSpinner,
  getVerbosityLevel,
} from '../spinner'

type Flags = { help: void; 'config-root': string; verbose: boolean }

export const checkAllConfigFiles = async (flags: Flags): Promise<void> => {
  startSpinner('Check all config files for encryption...')

  const globPattern = `${flags['config-root']}/**/*.{yml,yaml}`
  const configFiles = await fastGlob(globPattern)

  if (configFiles.length === 0) {
    failSpinner(`Found no config files in '${globPattern}'.\n`, new Error())
    process.exit(1)
  }

  const checkResultsPerFile = configFiles.map((configPath) =>
    checkOneConfigFile(configPath, flags)
  )

  if (checkResultsPerFile.includes(false)) {
    failSpinner('Not all secrets are encrypted', new Error())
    process.exit(1)
  }

  succeedSpinner('Secrets in all config files are safely encrypted')
}

export const checkOneConfigFile = (path: string, flags: Flags): boolean => {
  startSpinner(`Checking ${path} for encryption...`)

  if (!pathExistsSync(path)) {
    failSpinner(
      `${path} doesn't exist.\nPlease either provide a valid path to a config file or don't pass any arguments to check all config files in '${flags['config-root']}'`,
      // FIXME: Remove need to pass an error object to failSpinner()
      new Error()
    )

    return false
  }

  const configFile = getFileFromPath(path)

  if (checkEncryption(configFile.contents)) {
    succeedSpinner(
      `Secrets in ${path} are safely encrypted${
        flags.verbose
          ? `:\n${JSON.stringify(configFile.contents, undefined, 2)}`
          : ''
      }`
    )

    return true
  } else {
    failSpinner(
      `Secrets in ${path} are NOT encrypted${
        flags.verbose
          ? `:\n${JSON.stringify(configFile.contents, undefined, 2)}`
          : ''
      }`,
      new Error(),
      getVerbosityLevel((flags.verbose as unknown) as boolean)
    )

    return false
  }
}

export const checkEncryption = (
  configObject: JSONObject | EncryptedConfig
): boolean => {
  return Object.keys(configObject).includes('sops')
}

export default class CheckEncryption extends Command {
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

  async run(): Promise<void> {
    const { args, flags } = this.parse(CheckEncryption)

    if (args.config_file) {
      checkOneConfigFile(args.config_file, flags)
        ? process.exit(0)
        : process.exit(1)
    } else {
      await checkAllConfigFiles(flags)
    }

    process.exit(0)
  }
}
