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

export const defaultOptions: Options = {
  configRoot: 'config',
  runtimeEnvName: 'NODE_ENV',
  types: {
    rootTypeName: 'Config',
    fileName: 'types.d.ts',
  },
  substitutionPattern: '\\$\\{(\\w+)\\}',
}

export default defaultOptions
