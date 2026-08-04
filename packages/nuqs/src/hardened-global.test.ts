import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('hardened globalThis', () => {
  it('loads the public client entry in a non-extensible realm', () => {
    const entry = new URL('../dist/index.js', import.meta.url).href
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `Object.preventExtensions(globalThis); await import(${JSON.stringify(entry)})`
      ],
      { encoding: 'utf8' }
    )
    expect(result.status, result.stderr).toBe(0)
  })

  it('loads the public server entry without a Node process global', () => {
    const entry = new URL('../dist/server.js', import.meta.url).href
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `await import('react'); delete globalThis.process; const nuqs = await import(${JSON.stringify(entry)}); nuqs.createSerializer({ q: nuqs.parseAsString })({ q: 'hello' })`
      ],
      { encoding: 'utf8' }
    )
    expect(result.status, result.stderr).toBe(0)
  })
})
