import execa from 'execa'
import yaml from 'js-yaml'
import R from 'ramda'

import { EncryptedConfig, DecryptedConfig } from '../types'

const hasSopsMetadata = R.has('sops')

export const runSopsWithOptions = (options: string[]): string => {
  const execaReturn = execa.sync('sops', options)

  if (execaReturn.exitCode !== 0) {
    throw new Error(execaReturn.toString())
  }

  return execaReturn.stdout.toString()
}

export const decryptToObject = (
  filePath: string,
  parsedConfig: EncryptedConfig
): DecryptedConfig => {
  if (R.isNil(parsedConfig)) {
    throw new Error('Config is nil and can not be decrytped')
  }

  // If there's no SOPS metadata, parsedConfig already represents decrypted config
  if (!hasSopsMetadata(parsedConfig)) {
    return parsedConfig
  }

  const sopsResult = runSopsWithOptions(['--decrypt', filePath])

  return yaml.load(sopsResult)
}

export const decryptInPlace = (filePath: string): void =>
  (runSopsWithOptions(['--decrypt', '--in-place', filePath]) as unknown) as void

export const getSopsOptions = (
  args: Record<string, any>,
  flags: Record<string, any>
): string[] => {
  const options = []

  if (args['output_path']) {
    options.push('--output', args['output_path'])
  } else {
    options.push('--in-place')
  }

  if (flags['key-provider'] && flags['key-id']) {
    switch (flags['key-provider']) {
      case 'pgp':
        options.push('--pgp')
        break
      case 'gcp':
        options.push('--gcp-kms')
        break
      case 'aws':
        options.push('--kms')
        break
      case 'azr':
        options.push('--azure-kv')
        break
      default:
        // Should not be reached as we define possible options in Encrypt.flags (commands/encrypt.ts)
        throw new Error(`Unsupported key provider ${flags['key-provider']}`)
    }
    options.push(flags['key-id'])
  }

  // Note that --unencrypted-key-suffix and --encrypted-key-suffix
  // are mutual exclusive in both strong-config and SOPS.
  if (flags['unencrypted-key-suffix'] !== undefined) {
    options.push('--unencrypted-suffix', flags['unencrypted-key-suffix'])
  } else if (flags['encrypted-key-suffix'] !== undefined) {
    options.push('--encrypted-suffix', flags['encrypted-key-suffix'])
  }

  if (flags.verbose) {
    options.push('--verbose')
  }

  options.push(args['config_path'])

  return options
}
