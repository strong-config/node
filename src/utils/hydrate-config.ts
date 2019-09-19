import R from 'ramda'
import { substituteWithEnv } from './substitute-with-env'

export const hydrateConfig = (runtimeEnvironment: string) =>
  R.compose(
    R.assoc('runtimeEnvironment', runtimeEnvironment),
    R.unary(JSON.parse),
    substituteWithEnv,
    R.unary(JSON.stringify)
  )
