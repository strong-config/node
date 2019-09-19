import R from 'ramda'

export const validate = (schema: any): true => {
  // TODO: expand
  if (R.isNil(schema)) {
    throw new Error('Config does not match the specified schema')
  }

  return true
}
