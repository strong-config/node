import { compileFromFile } from 'json-schema-to-typescript'
import fs from 'fs'
import pascalCase from 'pascal-case'

export const generateTypeFromSchema = async (
  filePath: string
): Promise<void> => {
  // TODO: remove `[k: string]: any;` in all generated interfaces. No option for this?
  const baseTypes = await compileFromFile(filePath)

  const schemaString = fs.readFileSync(filePath).toString()
  const schemaObject = JSON.parse(schemaString)

  // TODO: Make runtimeEnvironment configurable but keep a default
  const configInterfaceAsString = `export interface Config extends ${pascalCase(
    schemaObject.title
  )} {
  runtimeEnvironment: string;
}`
  const exportedTypes = baseTypes.concat(configInterfaceAsString)

  // TODO: Make filename configurable
  fs.writeFileSync('strongconfig.d.ts', exportedTypes)
}
// Old logic
// if (
//   process.env.BBK_RUNTIME_ENVIRONMENT === 'development' &&
//   schemaFile.fileType === 'json'
// ) {
//   //
//   const generateFlowTypeFromJsonSchema = nullrequire(
//     './generate-flow-type-from-schema'
//   )

//   schemaFile.contents.required.push('runtimeEnvironment')
//   schemaFile.contents.properties.runtimeEnvironment = {
//     $id: '#/properties/runtimeEnvironment',
//     type: 'string',
//     enum: ['development', 'review', 'staging', 'production'],
//     title: 'BBK runtime environment',
//     default: '',
//     pattern: '/^development|review|staging|production$/',
//   }
//   generateFlowTypeFromJsonSchema(schemaFile.contents)
// }
