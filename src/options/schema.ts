export const optionsSchema = {
  type: 'object',
  title: 'Schema for strong-config options',
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
      title: 'Runtime environment variable name',
      description:
        'The value of this variable determines which config is loaded',
      examples: ['NODE_ENV', 'RUNTIME_ENVIRONMENT'],
      type: 'string',
      pattern: '^[a-zA-Z]\\w*$',
    },
    types: {
      title: 'Type-related options',
      description:
        'Type-related options controlling the generation of Typescript types for the config',
      type: ['object'],
      additionalProperties: false,
      properties: {
        rootTypeName: {
          title: 'Root type name',
          description: 'The name of the generated root type',
          examples: ['Config', 'AppConfig'],
          type: 'string',
          pattern: '^[A-Z]\\w*$',
        },
        filePath: {
          title: 'Path to types file',
          description: 'The file that the generated types should be stored in',
          examples: ['strong-config.d.ts', './types/config.ts'],
          type: 'string',
        },
      },
    },
    substitutionPattern: {
      title: 'Substitution pattern',
      description:
        'The escaped regexp that is used to match against template strings to be replaced with their corresponding environment variable values',
      examples: ['\\$\\{(\\w+)\\}', '\\$(\\w+)'],
      type: 'string',
      format: 'regex',
    },
    configPath: {
      title: 'Config path',
      description: 'A path to a directory that contains all config files',
      examples: ['config', '../config', '/app/config/'],
      type: 'string',
    },
    schemaPath: {
      title: 'Schema path',
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
