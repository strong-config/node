import R from 'ramda'
import { substituteWithEnv } from './substitute-with-env'

import { DecryptedConfig, HydratedConfig } from '../types'
import { Options } from '../options'

export type InnerHydrateFunction = (
  decryptedConfig: DecryptedConfig
) => HydratedConfig

export const hydrateConfig = (
  runtimeEnv: string,
  { substitutionPattern }: Options
): InnerHydrateFunction =>
  R.compose(
    R.assoc('runtimeEnv', runtimeEnv),
    R.unary(JSON.parse),
    substituteWithEnv(substitutionPattern),
    R.unary(JSON.stringify)
  )
