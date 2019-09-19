import R from 'ramda'

// TODO: Capture less strict /\${(.*)}/g so we can throw explicity when captured group violates /[a-zA-Z_]+[a-zA-Z0-9_]*/ (https://stackoverflow.com/a/2821201/3626075)
const REGEXP_SUBSTITUTION_PATTERN = /\${(\w+)}/g

export const substituteWithEnv = (stringContent: string): string =>
  stringContent.replace(
    REGEXP_SUBSTITUTION_PATTERN,
    (original, key: string) => {
      if (!R.has(key, process.env) || R.isNil(process.env[key])) {
        throw new Error(`process.env is missing key "${key}"`)
      }

      if (!isNaN(Number(original.charAt(0)))) {
        throw new Error('Environment variable must not start with a digit')
      }

      return process.env[key] as string
    }
  )
