import { existsSync } from 'fs'
import { sync } from 'execa'
import { load } from 'js-yaml'
import { has, isNil } from 'ramda'
import which from 'which'

import type { DecryptedConfig, EncryptedConfig } from '../types'

function getSopsBinary(): string | undefined {
  if (which.sync('sops', { nothrow: true })) {
    return 'sops'
  }

  if (existsSync('sops')) {
    return './sops'
  }

  return
}

const sopsErrors = {
  SOPS_NOT_FOUND: `Couldn't find 'sops' binary. Please make sure it's available in your runtime environment`,
  DECRYPTION_ERROR: `Sops failed to retrieve the decryption key. This is often a permission error with your KMS provider.`,
}

export const runSopsWithOptions = (options: string[]): string => {
  const sopsBinary = getSopsBinary()

  if (!sopsBinary) {
    throw new Error(sopsErrors['SOPS_NOT_FOUND'])
  }

  const sopsResult = sync(sopsBinary, options)

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
  parsedConfig: EncryptedConfig
): DecryptedConfig => {
  if (isNil(parsedConfig)) {
    throw new Error('Config is nil and can not be decrytped')
  }

  // If there's no SOPS metadata, parsedConfig already represents decrypted config
  if (!has('sops')(parsedConfig)) {
    return parsedConfig
  }

  const sopsResult = runSopsWithOptions(['--decrypt', filePath])

  // We should be able to safely typecast this because runSopsWithOptions() should have already failed if it couldn't decrypt the config
  return load(sopsResult) as DecryptedConfig
}

export const decryptInPlace = (filePath: string): void =>
  (runSopsWithOptions(['--decrypt', '--in-place', filePath]) as unknown) as void

export const getSopsOptions = (
  /* eslint-disable @typescript-eslint/no-explicit-any */
  args: Record<string, any>,
  flags: Record<string, any>
  /* eslint-enable @typescript-eslint/no-explicit-any */
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
        // Should not be reached as we define possible options in Encrypt.flags (commands/encrypt.ts)
        throw new Error(`Unsupported key provider ${flags['key-provider']}`)
    }

    options.push(flags['key-id'])
  }

  /*
   * Note that --unencrypted-key-suffix and --encrypted-key-suffix
   * are mutual exclusive in both strong-config and SOPS.
   */
  if (flags['unencrypted-key-suffix'] !== undefined) {
    options.push('--unencrypted-suffix', flags['unencrypted-key-suffix'])
  } else if (flags['encrypted-key-suffix'] !== undefined) {
    options.push('--encrypted-suffix', flags['encrypted-key-suffix'])
  }

  if (flags.verbose) {
    options.push('--verbose')
  }

  options.push(args['config_file'])

  return options
}
