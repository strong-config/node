export interface TypeOptions {
  rootTypeName: string
  filePath: string
}

export interface Options {
  runtimeEnvName: string
  types: TypeOptions | false
  substitutionPattern: string
  configPath: string
  schemaPath: string
}

export const defaultOptions: Options = {
  runtimeEnvName: 'NODE_ENV',
  types: {
    rootTypeName: 'Config',
    filePath: 'strong-config.d.ts',
  },
  substitutionPattern: '\\$\\{(\\w+)\\}',
  configPath: 'config/',
  schemaPath: 'config/schema.json',
}
