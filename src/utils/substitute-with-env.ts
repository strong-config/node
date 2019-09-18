export const envsubst = (stringContent: string): string | number => {
  const regex = /\${(\w+)}/g

  return stringContent.replace(regex, (original, key: string) => {
    if (!process.env.hasOwnProperty(key)) {
      throw new Error(`process.env is missing key "${key}"`)
    }

    // $FlowIgnore because 'process' isn't sufficiently typed
    return process.env[key]
  })
}
