// TODO: These types be improved once recursive type references are released (https://github.com/microsoft/TypeScript/pull/33050)

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface JSONArray extends Array<JSONValue> {}
type JSONValue = string | number | boolean | JSONObject | JSONArray
interface JSONObject {
  [x: string]: JSONValue
}
type BaseConfig = JSONObject
type Schema = JSONObject

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
type EncryptedConfig = { sops?: SopsMetadata } & BaseConfig
type DecryptedConfig = Omit<BaseConfig, 'sops'>
type HydratedConfig = { runtimeEnvironment: string } & DecryptedConfig
type MemoizedConfig = HydratedConfig | undefined
