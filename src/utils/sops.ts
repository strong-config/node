import execa from 'execa'
import yaml from 'js-yaml'
import R from 'ramda'

import { EncryptedConfig, DecryptedConfig } from '../types'

const hasSopsMetadata = R.has('sops')

const runSopsWithOptions = (options: string[]): string => {
  const { stdout, stderr } = execa.sync('sops', options)

  if (stderr && stderr.toString().length) {
    throw new Error(stderr.toString())
  }

  return stdout.toString()
}

export const decryptToObject = (
  filePath: string,
  parsedConfig: EncryptedConfig
): DecryptedConfig => {
  if (R.isNil(parsedConfig)) {
    throw new Error('Config is nil and can not be decrytped')
  }

  // If there's no SOPS metadata, parsedConfig already represents decrypted config
  if (parsedConfig && !hasSopsMetadata(parsedConfig)) {
    return parsedConfig
  }

  const sopsResult = runSopsWithOptions(['--decrypt', filePath])

  return yaml.load(sopsResult)
}

export const decryptInPlace = (filePath: string): void =>
  (runSopsWithOptions(['--decrypt', '--in-place', filePath]) as unknown) as void
