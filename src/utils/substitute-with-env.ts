import R from 'ramda'

const REGEXP_SUBSTITUTION_PATTERN = /\${(\w+)}/g

export const substituteWithEnv = (stringContent: string): string =>
  stringContent.replace(
    REGEXP_SUBSTITUTION_PATTERN,
    (original, key: string) => {
      if (!R.has(key, process.env) || R.isNil(process.env[key])) {
        throw new Error(`process.env is missing key "${key}"`)
      }

      if (!isNaN(Number(original.charAt(2)))) {
        throw new Error('Environment variable must not start with a digit')
      }

      return process.env[key] as string
    }
  )
