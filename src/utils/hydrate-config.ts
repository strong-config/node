import R from 'ramda'
import { substituteWithEnv } from './substitute-with-env'

import { DecryptedConfig, HydratedConfig } from '../types'

export type InnerHydrateFunction = (
  decryptedConfig: DecryptedConfig
) => HydratedConfig

export const hydrateConfig = (
  runtimeEnvironment: string
): InnerHydrateFunction =>
  R.compose(
    R.assoc('runtimeEnvironment', runtimeEnvironment),
    R.unary(JSON.parse),
    substituteWithEnv,
    R.unary(JSON.stringify)
  )
