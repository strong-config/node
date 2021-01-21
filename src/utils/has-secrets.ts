import { JSONObject } from '../types'

export function hasSecrets(config: JSONObject): boolean {
  const recursiveSearchForSecrets = (
    // eslint-disable-next-line unicorn/prevent-abbreviations
    obj: Record<string, unknown>,
    results: boolean[] = []
  ): boolean[] => {
    const r = results

    Object.keys(obj).forEach((key) => {
      const value = obj[key] as Record<string, unknown>

      if (key.endsWith('Secret') && typeof value !== 'object') {
        r.push(true)
      } else if (typeof value === 'object') {
        recursiveSearchForSecrets(value, r)
      }
    })

    return r
  }

  return recursiveSearchForSecrets(config).includes(true)
}
