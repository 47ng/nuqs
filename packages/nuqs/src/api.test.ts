import { readdir, readFile } from 'node:fs/promises'
import { join, posix, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'

// Snapshots the public API of each package.json entry point (issue #1059),
// as extracted from the built output in dist:
// runtime exports, type declarations, and importability.
// Update the snapshots when changing the API
// with `pnpm build && pnpm test:unit -u`
// (and adjust the documentation accordingly).
// Limitation: types referenced in signatures but not exported
// (eg: LimitUrlUpdates) appear by name only, without their declaration,
// so changes to their shape don't surface here;
// behavioral coverage for those lives in tests/*.test-d.ts.

// -- Timing instrumentation --

type Timing = { total: number; count: number; max: number }
const timings = new Map<string, Timing>()

function record(label: string, ms: number) {
  const timing = timings.get(label) ?? { total: 0, count: 0, max: 0 }
  timing.total += ms
  timing.count += 1
  timing.max = Math.max(timing.max, ms)
  timings.set(label, timing)
}

async function timed<T>(label: string, fn: () => T | Promise<T>): Promise<T> {
  const start = performance.now()
  try {
    return await fn()
  } finally {
    record(label, performance.now() - start)
  }
}

afterAll(() => {
  const ms = (value: number) => value.toFixed(1).padStart(7)
  const rows = [...timings.entries()].sort((a, b) => b[1].total - a[1].total)
  const lines = rows.map(
    ([label, { total, count, max }]) =>
      `${ms(total)} ms  ${String(count).padStart(3)}×  ${ms(max)} ms  ${label}`
  )
  process.stdout.write(
    `\napi.test.ts step timings (total | calls | max):\n${lines.join('\n')}\n\n`
  )
})

// -- Module initialization (runs at collection time) --

const { extractDts, extractRuntime, resolvePackageEntriesSync } = await timed(
  'import tsnapi (incl. oxc-parser binding)',
  () => import('tsnapi')
)

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const distRoot = join(packageRoot, 'dist')
const snapshotRoot = join(packageRoot, 'tests', 'snapshots')
const entries = await timed('resolvePackageEntriesSync', () =>
  resolvePackageEntriesSync(packageRoot)
)
const chunkSources = await timed('loadChunkSources', loadChunkSources)

async function loadChunkSources() {
  const files = (await timed('  readdir dist', () =>
    readdir(distRoot, { recursive: true })
  ))
    .map(file => file.split(sep).join('/'))
    .filter(path => path.endsWith('.d.ts') || path.endsWith('.js'))
    .sort()
  const sources = await timed('  readFile dist sources', () =>
    Promise.all(
      files.map(
        async path =>
          [path, await readFile(join(distRoot, path), 'utf-8')] as const
      )
    )
  )
  const runtime = new Map<string, string>()
  const dts = new Map<string, string>()
  for (const [path, code] of sources) {
    if (path.endsWith('.d.ts')) {
      dts.set(`./${path.replace(/\.d\.ts$/, '.d.mts')}`, code)
    } else {
      runtime.set(`./${path}`, code)
    }
  }
  return { runtime, dts }
}

// tsnapi expands declarations re-exported from shared chunks
// by looking up chunk sources keyed by import specifier,
// and parses each chunk in the language its file extension implies.
// Adapting to the dist layout tsdown emits here requires two rewrites:
// 1. Type chunks get a `.d.mts` key instead of the emitted `.js` specifier,
//    to parse in declaration mode
//    (a `.js` name means JavaScript to the parser,
//    collapsing chunk-hosted declarations to a bare `export { name }`).
// 2. Specifiers are resolved to dist-root-relative form (the exact map keys)
//    to bypass tsnapi's match-by-basename fallback,
//    which is ambiguous when dist files share a basename (eg: testing.js).
// This shim could be upstreamed to tsnapi as a chunk-sources option:
// https://github.com/antfu/tsnapi
function canonicalizeSpecifiers(
  code: string,
  entryDir: string,
  extension: string
) {
  return code.replace(
    /(?<=from ")(\.[^"]+)\.js(?=")/g,
    (_, specifier: string) => `./${posix.join(entryDir, specifier)}${extension}`
  )
}

function distSource(map: Map<string, string>, key: string) {
  const source = map.get(key)
  if (source === undefined) {
    // Fails loudly if the dist naming conventions (tsdown outExtensions)
    // ever drift from the assumptions baked into loadChunkSources.
    throw new Error(`No dist source found for ${key}`)
  }
  return source
}

// Direct map hits are load-bearing (see canonicalizeSpecifiers):
// a miss would engage tsnapi's ambiguous basename fallback,
// or signal that the canonicalization regex no longer matches the dist output.
function assertSpecifiersResolve(
  code: string,
  map: Map<string, string>,
  entryName: string
) {
  for (const [, specifier = ''] of code.matchAll(/from "(\.[^"]+)"/g)) {
    if (!map.has(specifier)) {
      throw new Error(
        `Unresolved import specifier in ${entryName}: ${specifier}`
      )
    }
  }
}

// Guards against tsnapi degradations that would otherwise stay green:
// a re-export it cannot resolve renders as a bare `export { name }`
// instead of erroring (resolved declarations carry their full text,
// and passthrough re-exports keep their `from` clause),
// and a failed extraction renders as an empty snapshot,
// indistinguishable from a side-effect-only module (only ./debug is one).
function assertExtracted(snapshot: string, entryName: string) {
  const collapsed = snapshot.match(/^export (?:type )?\{[^}]*\}$/m)
  if (collapsed) {
    throw new Error(`Unresolved re-export in ${entryName}: ${collapsed[0]}`)
  }
  if (snapshot.trim() === '' && entryName !== './debug') {
    throw new Error(`Empty API snapshot for ${entryName}`)
  }
}

function stemOf(entryName: string) {
  return entryName === '.' ? 'index' : entryName.replace(/^\.\//, '')
}

function normalize(snapshot: string) {
  return (snapshot.trim() || '/* no exports */') + '\n'
}

describe('public API', () => {
  for (const entry of entries) {
    const stem = stemOf(entry.name)
    if (entry.runtime) {
      const runtimeFile = entry.runtime
      const path = relative(distRoot, runtimeFile).split(sep).join('/')
      it(`${entry.name} (runtime)`, async () => {
        const code = await timed('canonicalize + assert (runtime)', () => {
          const code = canonicalizeSpecifiers(
            distSource(chunkSources.runtime, `./${path}`),
            posix.dirname(path),
            '.js'
          )
          assertSpecifiersResolve(code, chunkSources.runtime, entry.name)
          return code
        })
        const snapshot = await timed('extractRuntime', () =>
          extractRuntime(path, code, {
            chunkSources: chunkSources.runtime
          })
        )
        assertExtracted(snapshot, entry.name)
        await timed('toMatchFileSnapshot (runtime)', () =>
          expect(normalize(snapshot)).toMatchFileSnapshot(
            join(snapshotRoot, `${stem}.snapshot.js`)
          )
        )
      })
      it(`${entry.name} (import)`, async () => {
        await timed('import dist entry', () =>
          expect(import(pathToFileURL(runtimeFile).href)).resolves.toBeDefined()
        )
      })
    }
    if (entry.dts) {
      const path = relative(distRoot, entry.dts).split(sep).join('/')
      it(`${entry.name} (types)`, async () => {
        const code = await timed('canonicalize + assert (types)', () => {
          const key = `./${path.replace(/\.d\.ts$/, '.d.mts')}`
          const code = canonicalizeSpecifiers(
            distSource(chunkSources.dts, key),
            posix.dirname(path),
            '.d.mts'
          )
          assertSpecifiersResolve(code, chunkSources.dts, entry.name)
          return code
        })
        const snapshot = await timed('extractDts', () =>
          extractDts(path, code, {
            chunkSources: chunkSources.dts
          })
        )
        assertExtracted(snapshot, entry.name)
        await timed('toMatchFileSnapshot (types)', () =>
          expect(normalize(snapshot)).toMatchFileSnapshot(
            join(snapshotRoot, `${stem}.snapshot.d.ts`)
          )
        )
      })
    }
  }

  it('covers every package.json export', async () => {
    const pkg = JSON.parse(
      await readFile(join(packageRoot, 'package.json'), 'utf-8')
    )
    const expected = Object.keys(pkg.exports)
      .filter(name => name !== './package.json')
      .sort()
    // The whole suite is generated from tsnapi's entry enumeration:
    // this pins it to the exports map, so an entry it fails to resolve
    // (unusual condition shape, tsnapi regression) cannot ship untracked.
    expect(entries.map(entry => entry.name).sort()).toEqual(expected)
    for (const entry of entries) {
      // All entries currently resolve both files; if a types-only or
      // runtime-only entry ever appears, make the exception explicit here.
      expect(entry.runtime, `${entry.name} runtime`).not.toBeNull()
      expect(entry.dts, `${entry.name} types`).not.toBeNull()
    }
  })

  it('has no orphaned snapshots', async () => {
    const expected = entries
      .flatMap(entry => [
        ...(entry.runtime ? [`${stemOf(entry.name)}.snapshot.js`] : []),
        ...(entry.dts ? [`${stemOf(entry.name)}.snapshot.d.ts`] : [])
      ])
      .sort()
    const snapshots = (await readdir(snapshotRoot, { recursive: true }))
      .map(file => file.split(sep).join('/'))
      .filter(
        path => path.endsWith('.snapshot.js') || path.endsWith('.snapshot.d.ts')
      )
      .sort()
    expect(snapshots).toEqual(expected)
  })
})
