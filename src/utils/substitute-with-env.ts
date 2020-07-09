import matchAll from 'match-all'

export const substituteWithEnv = (substitutionPattern: RegExp) => (
  config: string
): string => {
  if (config.includes('${}')) {
    throw new TypeError(
      "Config can't contain empty substitution template '${}'"
    )
  }

  let envVarsWithIllegalCharacters

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore because matchAll is in fact undefined in Node versions < 12.x
  if (String.prototype.matchAll) {
    envVarsWithIllegalCharacters = [...config.matchAll(/\${(.*?)}/g)]
      .map((matches) => matches[1])
      .filter((envVarName) => /\W/.test(envVarName))
  } else {
    // This is a polyfill because String.prototype.matchAll is only support from Node 12.x upwards
    envVarsWithIllegalCharacters = matchAll(config, /\${(.*?)}/g)
      .toArray()
      .filter((envVarName) => /\W/.test(envVarName))
  }

  if (envVarsWithIllegalCharacters.length > 0) {
    throw new TypeError(
      `Env vars '${envVarsWithIllegalCharacters.join(
        ','
      )}' contain unsupported characters. Env var names should only contain a-z, A-Z, 0-9, and _`
    )
  }

  return config.replace(
    substitutionPattern,
    (_original: string, envVar: string) => {
      if (!process.env[envVar]) {
        throw new Error(`Environment variable "${envVar}" is undefined`)
      }

      if (/^\d/.test(envVar)) {
        throw new TypeError('Environment variable must not start with a digit')
      }

      return process.env[envVar] as string
    }
  )
}
