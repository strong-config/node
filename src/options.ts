export interface TypeOptions {
  rootTypeName: string
  fileName: string
}

export interface Options {
  runtimeEnvName: string
  types: TypeOptions | false
  substitutionPattern: string
  configRoot: string
}

export const defaultOptions: Pick<
  Options,
  'runtimeEnvName' | 'substitutionPattern' | 'configRoot'
> & { types: TypeOptions } = {
  configRoot: 'config',
  runtimeEnvName: 'NODE_ENV',
  types: {
    rootTypeName: 'Config',
    fileName: 'types.d.ts',
  },
  substitutionPattern: '\\$\\{(\\w+)\\}',
}
