/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export type Name = string
export type ASharedFieldThatSDefinedInTheBaseConfig = string
export type AConfigSpecificFieldThatSDifferentPerEnvironment = string

export interface ExampleConfig {
  name: Name
  someSharedField: ASharedFieldThatSDefinedInTheBaseConfig
  someDifferentField: AConfigSpecificFieldThatSDifferentPerEnvironment
}

export interface Config extends ExampleConfig {
  runtimeEnv: string
}