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

export enum ConfigFileExtensions {
  JSON = 'json',
  YAML = 'yaml',
  YML = 'yml',
}

// For defaultOptions, we know that the types-property will never be false because we control it
export type DefaultOptions = Pick<
  Options,
  'runtimeEnvName' | 'substitutionPattern' | 'configRoot'
> & { types: TypeOptions }

export const defaultOptions: DefaultOptions = {
  configRoot: 'config',
  runtimeEnvName: 'NODE_ENV',
  types: {
    rootTypeName: 'Config',
    fileName: 'types.d.ts',
  },
  substitutionPattern: '\\$\\{(\\w+)\\}',
}
