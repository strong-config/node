// TODO: These types be improved once recursive type references are released (https://github.com/microsoft/TypeScript/pull/33050)

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface JSONArray extends Array<JSONValue> {}
type JSONValue = string | number | boolean | JSONObject | JSONArray
export interface JSONObject {
  [x: string]: JSONValue
}
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
export type HydratedConfig = { runtimeEnvironment: string } & DecryptedConfig
export type MemoizedConfig = HydratedConfig | undefined

export enum FileExtension {
  JSON = 'json',
  YAML = 'yaml',
  YML = 'yml',
}
export type File = {
  contents: EncryptedConfig | Schema
  filePath: string
}
