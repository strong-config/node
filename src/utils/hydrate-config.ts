import { assoc, compose, unary } from 'ramda'
import { DecryptedConfig, HydratedConfig } from '../types'
import type { Options } from '../options'
import { substituteWithEnv } from './substitute-with-env'

export type HydrateConfig = (decryptedConfig: DecryptedConfig) => HydratedConfig

export const hydrateConfig = (
  runtimeEnv: string,
  { substitutionPattern }: Options
): HydrateConfig =>
  compose(
    assoc('runtimeEnv', runtimeEnv),
    unary(JSON.parse),
    substituteWithEnv(substitutionPattern),
    unary(JSON.stringify)
  )
