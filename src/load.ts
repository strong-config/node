import R from "ramda";
import { generateTypeFromSchema } from "./utils/generate-type-from-schema";
import { hydrateConfig } from "./utils/hydrate-config";
import { validateConfig } from "./utils/validate-config";
import { readConfigFile, readSchemaFile } from "./utils/read-file";
import * as sops from "./utils/sops";

let memoizedConfig: MemoizedConfig = undefined;

export const getMemoizedConfig = (): MemoizedConfig => {
  return memoizedConfig;
};

export const clearMemoizedConfig = (): void => {
  memoizedConfig = undefined;
};

export const load = (
  passedConfig: MemoizedConfig = memoizedConfig
): HydratedConfig => {
  if (R.isNil(process.env.RUNTIME_ENVIRONMENT)) {
    throw new Error("process.env.RUNTIME_ENVIRONMENT must be defined.");
  }

  if (!R.isNil(passedConfig)) {
    memoizedConfig = {
      ...passedConfig,
      runtimeEnvironment: process.env.RUNTIME_ENVIRONMENT
    };
    return memoizedConfig;
  }

  const configFile = readConfigFile(process.env.RUNTIME_ENVIRONMENT);

  const decrypted = sops.decryptToObject(
    configFile.filePath,
    configFile.contents
  );

  const config = hydrateConfig(process.env.RUNTIME_ENVIRONMENT)(decrypted);

  const schemaFile = readSchemaFile("schema");

  if (schemaFile !== undefined) {
    validateConfig(config, schemaFile.contents);

    generateTypeFromSchema("config/schema.json");
  }

  memoizedConfig = config;

  return config;
};
