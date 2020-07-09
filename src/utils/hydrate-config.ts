import { DecryptedConfig, HydratedConfig } from '../types'
import { substituteWithEnv } from './substitute-with-env'

export type HydrateConfig = (decryptedConfig: DecryptedConfig) => HydratedConfig

export function hydrateConfig(
  decryptedConfig: DecryptedConfig,
  runtimeEnv: string
): HydratedConfig {
  const configWithSubstitutedEnvVars = substituteWithEnv(decryptedConfig)

  return { ...configWithSubstitutedEnvVars, runtimeEnv }
}
