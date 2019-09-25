import { compileFromFile } from 'json-schema-to-typescript'
import fs from 'fs'
import pascalCase from 'pascal-case'

export const generateTypeFromSchema = async (
  filePath: string
): Promise<void> => {
  const baseTypes = await compileFromFile(filePath)

  const schemaString = fs.readFileSync(filePath).toString()
  const schemaObject = JSON.parse(schemaString)

  const configInterfaceAsString = `export interface Config extends ${pascalCase(
    schemaObject.title
  )} {
  runtimeEnvironment: string;
}`
  const exportedTypes = baseTypes.concat(configInterfaceAsString)

  fs.writeFileSync('strongconfig.d.ts', exportedTypes)
}
