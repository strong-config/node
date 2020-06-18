export const substituteWithEnv = (substitutionPattern: string) => (
  config: string
): string =>
  config.replace(
    new RegExp(substitutionPattern, 'g'),
    (original, key: string) => {
      if (!process.env[key]) {
        throw new Error(`process.env is missing key "${key}"`)
      }

      if (!Number.isNaN(Number(original.charAt(2)))) {
        throw new TypeError('Environment variable must not start with a digit')
      }

      return process.env[key] as string
    }
  )
