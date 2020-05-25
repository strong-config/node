import { sync } from 'execa'
import { load } from 'js-yaml'
import { has, isNil } from 'ramda'

import { EncryptedConfig, DecryptedConfig } from '../types'

const hasSopsMetadata = has('sops')

export const runSopsWithOptions = (options: string[]): string => {
  let sopsResult
  try {
    // Trying to use global `sops` from $PATH first
    console.log('try global sops')

    sopsResult = sync('sops', options)
  } catch (error) {
    console.log('❌ No global sops found', error.code)

    // If the error code is ENOENT, it likely means the 'sops' binary
    // isn't available in the global path. In this case, we want to swallow
    // the error here and retry with a local sops binary further down
    if (error.code !== 'ENOENT') {
      console.log('unexpected error with global sops', error.code)

      throw new Error(error)
    }
  }

  if (!sopsResult) {
    /*
     * If `sops` binary could not be found in $PATH, search in current directory
     * This is useful for serverless environments such as Google Cloud Functions
     * where it's not possible to install any non-npm binaries in the environment
     */
    try {
      console.log('try local sops')
      sopsResult = sync('./sops', options)
    } catch (error) {
      console.log('❌No local sops found', error.code)

      if (error.code === 'ENOENT') {
        throw new Error(
          `❌ Couldn't find 'sops' binary neither in $PATH nor in current directory via 'process.cwd()'\nPlease make sure it is available in your runtime environment.\n\n${error}`
        )
      } else {
        console.log('unexpected error with local sops', error.code)

        throw new Error(error)
      }
    }
  }

  if (sopsResult.exitCode !== 0) {
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
