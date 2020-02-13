export interface TypeOptions {
  rootTypeName: string
  filePath: string
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
  runtimeEnvName: 'NODE_ENV',
  types: {
    rootTypeName: 'Config',
    filePath: 'strong-config.d.ts',
  },
  substitutionPattern: '\\$\\{(\\w+)\\}',
  configRoot: 'config',
}

export default defaultOptions
