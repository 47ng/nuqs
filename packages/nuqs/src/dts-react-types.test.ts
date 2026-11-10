import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Declarations must not import from 'react' (#1634):
// under pnpm's global virtual store, TypeScript resolves it from nuqs's own folder,
// which has no @types/react, so React types silently become `any`.
// Use the global namespace (`React.ReactNode`) instead.

const distRoot = fileURLToPath(new URL('../dist', import.meta.url))
const declarations = await Promise.all(
  (await readdir(distRoot, { recursive: true }))
    .filter(path => path.endsWith('.d.ts'))
    .sort()
    .map(async path => ({
      path,
      code: await readFile(join(distRoot, path), 'utf-8')
    }))
)

describe('built type declarations', () => {
  it('exist', () => {
    expect(declarations.length).toBeGreaterThan(0)
  })
  it.each(declarations)('$path does not import from react', ({ code }) => {
    expect(code).not.toMatch(
      /(from\s+|import\()["']react(-dom)?(\/[^"']*)?["']/
    )
  })
  it.each(declarations)('$path references the React types', ({ code }) => {
    expect(code.startsWith('/// <reference types="react" />\n')).toBe(true)
  })
})
