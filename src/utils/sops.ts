import { existsSync } from 'fs'
import { sync } from 'execa'
import { load } from 'js-yaml'
import { has, isNil } from 'ramda'
import which from 'which'

import { EncryptedConfig, DecryptedConfig } from '../types'

const hasSopsMetadata = has('sops')

function getSopsBinary(): 'global' | 'local' | false {
  if (which.sync('sops', { nothrow: true })) {
    return 'global'
  }

  if (existsSync('sops')) {
    return 'local'
  }

  return false
}

export const runSopsWithOptions = (options: string[]): string => {
  const sopsBinary = getSopsBinary()
  if (!sopsBinary) {
    throw new Error(
      `Couldn't find 'sops' binary. Please make sure it's available in your runtime environment`
    )
  }

  let sopsResult
  try {
    sopsResult = sync(sopsBinary === 'global' ? 'sops' : './sops', options)
  } catch (error) {
    if (!sopsResult) {
      throw new Error(`Unexpected error when executing sops:\n\n${error}`)
    }
  }

  switch (sopsResult.exitCode) {
    case 0:
      break
    case 128:
      throw new Error(
        `Sops failed to retrieve the decryption key. This is often a permissin error with your KMS provider.\n${sopsResult}`
      )
    default:
      throw new Error(sopsResult.toString())
  }

  return sopsResult.stdout.toString()
}

export const decryptToObject = (
  filePath: string,
  parsedConfig: EncryptedConfig
): DecryptedConfig => {
  if (isNil(parsedConfig)) {
    throw new Error('Config is nil and can not be decrytped')
  }

  // If there's no SOPS metadata, parsedConfig already represents decrypted config
  if (!hasSopsMetadata(parsedConfig)) {
    return parsedConfig
  }

  const sopsResult = runSopsWithOptions(['--decrypt', filePath])

  return load(sopsResult)
}

export const decryptInPlace = (filePath: string): void =>
  (runSopsWithOptions(['--decrypt', '--in-place', filePath]) as unknown) as void

export const getSopsOptions = (
  /* eslint-disable @typescript-eslint/no-explicit-any */
  args: Record<string, any>,
  flags: Record<string, any>
  /* eslint-enable @typescript-eslint/no-explicit-any */
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

  options.push(args['config_file'])

  return options
}
