import fs from 'fs'
import execa from 'execa'
import yaml from 'js-yaml'
import which from 'which'
import type { DecryptedConfig, EncryptedConfig } from '../types'

export const sopsErrors = {
  SOPS_NOT_FOUND: `Couldn't find 'sops' binary. Please make sure it's available in your runtime environment`,
  DECRYPTION_ERROR: `Sops failed to retrieve the decryption key. This is often a permission error with your KMS provider.`,
  UNSUPPORTED_KEY_PROVIDER: 'Unsupported key provider:',
  KEY_SUFFIX_CONFLICT: `'--unencrypted-key-suffix' and '--encrypted-key-suffix' are mutually exclusive, pick one or the other`,
}

export function getSopsBinary(): string {
  if (which.sync('sops', { nothrow: true })) {
    return 'sops'
  }

  if (fs.existsSync('sops')) {
    return './sops'
  }

  throw new Error(sopsErrors['SOPS_NOT_FOUND'])
}

export const runSopsWithOptions = (options: string[]): string => {
  const sopsBinary = getSopsBinary()

  const sopsResult = execa.sync(sopsBinary, options)

  switch (sopsResult.exitCode) {
    case 0:
      return sopsResult.stdout.toString()
    case 128:
      throw new Error(`${sopsErrors['DECRYPTION_ERROR']}\n${sopsResult.stdout}`)
    default:
      throw new Error(`Unexpected sops error:\n${sopsResult.stdout}`)
  }
}

export const decryptToObject = (
  filePath: string,
  config: EncryptedConfig
): DecryptedConfig => {
  if (!config) {
    throw new Error('Config is nil and can not be decrytped')
  }

  // If there's no SOPS metadata, config is already decrypted
  if (!Object.prototype.hasOwnProperty.call(config, 'sops')) {
    return config
  }

  const sopsResult = runSopsWithOptions(['--decrypt', filePath])

  /*
   * We should be able to safely typecast the result because runSopsWithOptions()
   * should have already failed if it couldn't decrypt the config
   */
  return yaml.load(sopsResult) as DecryptedConfig
}

export const decryptInPlace = (filePath: string): void =>
  (runSopsWithOptions(['--decrypt', '--in-place', filePath]) as unknown) as void

export const getSopsOptions = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  flags: Record<string, any>
): string[] => {
  const options: string[] = []

  if (args['output_path']) {
    options.push('--output', args['output_path'])
  } else {
    options.push('--in-place')
  }

  if (
    flags['key-provider'] &&
    typeof flags['key-provider'] === 'string' &&
    flags['key-id']
  ) {
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
        // Should not be reached as we define possible options in Encrypt.flags (../cli/encrypt.ts)
        throw new Error(
          sopsErrors['UNSUPPORTED_KEY_PROVIDER'].concat(
            `\n${flags['key-provider']}`
          )
        )
    }

    options.push(flags['key-id'])
  }

  if (flags['unencrypted-key-suffix'] && !flags['encrypted-key-suffix']) {
    options.push('--unencrypted-suffix', flags['unencrypted-key-suffix'])
  } else if (
    flags['encrypted-key-suffix'] &&
    !flags['unencrypted-key-suffix']
  ) {
    options.push('--encrypted-suffix', flags['encrypted-key-suffix'])
  } else if (flags['encrypted-key-suffix'] && flags['unencrypted-key-suffix']) {
    throw new Error(sopsErrors['KEY_SUFFIX_CONFLICT'])
  }

  if (flags.verbose) {
    options.push('--verbose')
  }

  options.push(args['config_file'])

  return options
}
