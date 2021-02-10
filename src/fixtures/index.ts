import { compose, dissoc, set, lensProp } from 'ramda'
import { defaultOptions } from '../options'
import {
  EncryptedConfigFile,
  HydratedConfig,
  Schema,
  DecryptedConfig,
} from '../types'

const runtimeEnv = 'test'

export const encryptedConfigFile: EncryptedConfigFile = {
  filePath: `/mocked/path/${runtimeEnv}.yaml`,
  contents: {
    name: 'example-project',
    someField: { optionalField: 123, requiredField: 'crucial string' },
    someArray: ['joe', 'freeman'],
    someSecret:
      'ENC[AES256_GCM,data:abcdeBH8Xh06,iv:L5VSXtgaD7RXTt7HW0Pra6vDSBTbP8/dkyruXmMKtgU=,tag:tVwtqvz1QLXskFKXT4na7A==,type:str]',
    sops: {
      kms: [],
      gcp_kms: [],
      azure_kv: [],
      pgp: {
        created_at: '2019-11-15T15:12:21Z',
        enc: 'PGP MESSAGE',
        fp: 'MOCK',
      },
      encrypted_suffix: 'Secret',
      lastmodified: '<mocked timestamp>',
      mac: '<mocked mac>',
      version: '<mocked version>',
    },
  },
}

export const userOptions = { configRoot: 'example' }

export const validOptions = { ...defaultOptions, ...userOptions }

export const invalidOptions = { ...defaultOptions, invalid: 'option' }

// No idea how to make ramda types happy here 🤷‍♂️
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
export const decryptedConfig: DecryptedConfig = compose(
  // @ts-ignore
  set(lensProp('someSecret'), 'decrypted secret'),
  dissoc('sops')
  // @ts-ignore
)(encryptedConfigFile.contents)
// eslint-enable @typescript-eslint/ban-ts-comment

export const hydratedConfig: HydratedConfig = { ...decryptedConfig, runtimeEnv }

export const schema: Schema = {
  type: 'object',
  title: 'Example Config',
  required: ['name', 'someField'],
  additionalProperties: false,
  properties: {
    runtimeEnv: {
      type: 'string',
    },
    name: {
      title: 'Name',
      type: 'string',
    },
    someField: {
      title: 'Some Field',
      type: 'object',
      required: ['requiredField'],
      additionalProperties: false,
      properties: {
        requiredField: {
          title: 'A required field',
          type: 'string',
        },
        optionalField: {
          title: 'An optional field',
          type: 'integer',
        },
      },
    },
    someArray: {
      title: 'Some Array',
      type: 'array',
      items: {
        type: 'string',
      },
    },
    someSecret: {
      title: 'Some Secret',
      type: 'string',
    },
  },
}
