// NOTE: This file is needed for the String.prototype.matchAll() polyfill module we need to remain Node 10.x compatible
declare module 'match-all' {
  // eslint-disable-next-line import/no-default-export
  export default function matchAll(
    s: string,
    r: RegExp
  ): {
    input: string
    regex: RegExp
    next: () => string | null
    toArray: () => string[]
    reset: () => void
  }
}
