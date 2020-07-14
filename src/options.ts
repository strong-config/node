import { Schema } from './types'

export interface Options {
  configRoot: string
  runtimeEnvName: string
  generateTypes: boolean
}

export const defaultOptions: Options = {
  configRoot: 'config',
  runtimeEnvName: 'NODE_ENV',
  generateTypes: true,
}

export const optionsSchema: Schema = {
  type: 'object',
  title: 'Schema for strong-config options',
  required: ['configRoot', 'runtimeEnvName', 'generateTypes'],
  additionalProperties: false,
  properties: {
    configRoot: {
      title: 'Config root path',
      description: 'A path to a directory that contains all config files',
      examples: ['config', '../config', 'app/config/'],
      type: 'string',
    },
    runtimeEnvName: {
      title: 'Runtime environment variable name',
      description:
        'The value of this variable determines which config is loaded',
      examples: ['NODE_ENV', 'RUNTIME_ENVIRONMENT'],
      type: 'string',
      pattern: '^[a-zA-Z]\\w*$',
    },
    generateTypes: {
      title: 'Generate TypeScript types',
      description:
        'Boolean that governs whether to generate TypeScript types for the config or not',
      type: 'boolean',
    },
  },
}
