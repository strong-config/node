import { assoc, compose, unary } from 'ramda'
import { DecryptedConfig, HydratedConfig } from '../types'
import { substituteWithEnv } from './substitute-with-env'

export type HydrateConfig = (decryptedConfig: DecryptedConfig) => HydratedConfig

export const hydrateConfig = (runtimeEnv: string): HydrateConfig =>
  compose(
    assoc('runtimeEnv', runtimeEnv),
    unary(JSON.parse),
    substituteWithEnv,
    unary(JSON.stringify)
  )
