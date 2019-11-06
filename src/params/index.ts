export interface TypesParameters {
  rootTypeName: string
  filePath: string
}

export interface Parameters {
  runtimeEnvName: string
  types: TypesParameters | false
  substitutionPattern: string
  configPath: string
  schemaPath: string
}

export const defaultParameters: Parameters = {
  runtimeEnvName: 'NODE_ENV',
  types: {
    rootTypeName: 'Config',
    filePath: 'strong-config.d.ts',
  },
  substitutionPattern: '\\$\\{(\\w+)\\}',
  configPath: 'config/',
  schemaPath: 'config/schema.json',
}
