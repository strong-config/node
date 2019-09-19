import execa from 'execa'
import yaml from 'js-yaml'
import R from 'ramda'

const hasSopsMetadata = R.has('sops')

const runSopsWithOptions = (options: string[]): string => {
  const { stdout, stderr } = execa.sync('sops', options)

  if (stderr && stderr.length) {
    throw new Error(stderr)
  }

  return stdout
}

export const decryptToObject = (
  filePath: string,
  parsedConfig: Record<string, any> | undefined = undefined
): Record<string, any> => {
  // If there's no SOPS metadata, parsedConfig already represents decrypted config
  if (parsedConfig && !hasSopsMetadata(parsedConfig)) {
    return parsedConfig
  }

  const sopsResult = runSopsWithOptions(['--decrypt', filePath])

  return yaml.load(sopsResult)
}

export const decryptInPlace = (filePath: string): void =>
  (runSopsWithOptions(['--decrypt', '--in-place', filePath]) as any) as void
