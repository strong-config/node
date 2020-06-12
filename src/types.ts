type JSON = string | number | boolean | null | JSON[] | JSONObject

export type JSONObject = { [key: string]: JSON }

export type BaseConfig = JSONObject

export type Schema = JSONObject

type SopsMetadata = {
  kms: unknown | null
  gcp_kms: unknown | null
  azure_kv: unknown | null
  pgp: unknown | null
  lastmodified: string
  mac: string
  version: string
  encrypted_suffix?: string | null
}

export type EncryptedConfig = { sops?: SopsMetadata } & BaseConfig

export type DecryptedConfig = Omit<BaseConfig, 'sops'>

export type HydratedConfig = { runtimeEnv: string } & DecryptedConfig

export type MemoizedConfig = HydratedConfig | undefined

export enum ConfigFileExtensions {
  JSON = 'json',
  YAML = 'yaml',
  YML = 'yml',
}
