/*
 * json-schema-to-typescript uses a `toSafeString(string)` function to obtain a normalized string.
 * This pascalCase mimics this functionality, should address most cases, and reduces our dependency footprint.
 * => https://github.com/bcherny/json-schema-to-typescript/blob/f41945f19b68918e9c13885f345cb708e1d9898a/src/utils.ts#L163)
 */
export const pascalCase = (input: string): string =>
  input
    .split(/[^\dA-Za-z]+/g)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

export default pascalCase
