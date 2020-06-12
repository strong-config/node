import { assoc, compose, unary } from 'ramda'
import { DecryptedConfig, HydratedConfig } from '../types'
import { Options } from '../options'
import { substituteWithEnv } from './substitute-with-env'

export type InnerHydrateFunction = (
  decryptedConfig: DecryptedConfig
) => HydratedConfig

export const hydrateConfig = (
  runtimeEnv: string,
  { substitutionPattern }: Options
): InnerHydrateFunction =>
  compose(
    assoc('runtimeEnv', runtimeEnv),
    unary(JSON.parse),
    substituteWithEnv(substitutionPattern),
    unary(JSON.stringify)
  )
