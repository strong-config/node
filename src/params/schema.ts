export const parametersSchema = {
  type: 'object',
  title: 'Schema for strong-config parameters',
  required: [
    'runtimeEnvName',
    'types',
    'substitutionPattern',
    'configPath',
    'schemaPath',
  ],
  additionalProperties: false,
  properties: {
    runtimeEnvName: {
      title: 'The name of the runtime environment variable',
      description:
        'The value of this variable determines which config is loaded',
      examples: ['RUNTIME_ENVIRONMENT', 'RUNTIME_ENV'],
      type: 'string',
      pattern: '^[a-zA-Z]\\w*$',
    },
    types: {
      title: 'Parameters related to types',
      description:
        'Type-related parameters controlling the generation of Typescript types for the config',
      type: ['object'],
      additionalProperties: false,
      properties: {
        rootTypeName: {
          title: 'The name of the generated root type',
          description: 'The name of the generated root type',
          examples: ['Config', 'AppConfig'],
          type: 'string',
          pattern: '^[A-Z]\\w*$',
        },
        filePath: {
          title: 'The path of the generate type file',
          description: 'The file that the generated types should be stored to',
          examples: ['strong-config.d.ts', './types/config.ts'],
          type: 'string',
        },
      },
    },
    substitutionPattern: {
      title: 'The substitution pattern used for replacing template strings',
      description:
        'The escaped regexp that is used to match against template strings to be replaced with their corresponding environment variable values',
      examples: ['\\$\\{(\\w+)\\}', '\\$(\\w+)'],
      type: 'string',
      format: 'regex',
    },
    configPath: {
      title: 'The path to the config directory',
      description: 'A path to a directory that contains all config files',
      examples: ['config', '../config', '/app/config/'],
      type: 'string',
    },
    schemaPath: {
      title: 'The path to the schema file',
      description:
        'A path to a file that contains schema definitions for the configs',
      examples: [
        'config/schema.json',
        '../schema.json',
        '/app/config/schema.json',
      ],
      type: 'string',
    },
  },
}
