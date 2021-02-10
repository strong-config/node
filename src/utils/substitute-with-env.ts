import matchAll from 'match-all'
import { DecryptedConfig } from '../types'

export const substituteWithEnv = (
  decryptedConfig: DecryptedConfig
): DecryptedConfig => {
  /*
   * This substitution pattern will replace the following types of expressions
   * in a config file with the respective env var value at runtime:
   *
   *  PASS: ${AN_ENV_VAR}
   *  PASS: ${an_env_var}
   *  PASS: ${AN_ENV_VAR_1}
   *
   *
   * Following expressions will throw an error:
   *
   *  FAIL: ${AN_ENV_VAR!@#} => no special chars allowed
   *  FAIL: ${1AN_ENV_VAR}   => no digit as first char allowed
   *  FAIL: ${}              => no empty env var name allowed
   */
  const substitutionPattern = /\${(\w+)}/g
  const configAsString = JSON.stringify(decryptedConfig)

  if (configAsString.includes('${}')) {
    throw new TypeError(
      "Config can't contain empty substitution template '${}'"
    )
  }

  /* istanbul ignore next: the if-branch does not get executed in Node 10 environments and will drop test coverage < 100% if not ignored */
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore because 'matchAll' is undefined in Node versions < 12.x
  const envVariablesWithIllegalCharacters = String.prototype.matchAll
    ? [...configAsString.matchAll(/\${(.*?)}/g)]
        .map((matches) => matches[1])
        .filter((envVariableName) => /\W/.test(envVariableName))
    : matchAll(configAsString, /\${(.*?)}/g)
        .toArray()
        .filter(
          /* istanbul ignore next: no need to test the same logic used above again */
          (envVariableName) => /\W/.test(envVariableName)
        )

  if (envVariablesWithIllegalCharacters.length > 0) {
    throw new TypeError(
      `Env vars '${envVariablesWithIllegalCharacters.join(
        ','
      )}' contain unsupported characters. Env var names should only contain a-z, A-Z, 0-9, and _`
    )
  }

  const substitutedConfig = configAsString.replace(
    substitutionPattern,
    (_original: string, envVariable: string) => {
      if (!process.env[envVariable]) {
        throw new Error(`Environment variable "${envVariable}" is undefined`)
      }

      if (/^\d/.test(envVariable)) {
        throw new TypeError('Environment variable must not start with a digit')
      }

      return process.env[envVariable] as string
    }
  )

  return JSON.parse(substitutedConfig) as DecryptedConfig
}

export default substituteWithEnv
