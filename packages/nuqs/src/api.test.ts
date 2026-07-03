import { readdir, readFile } from 'node:fs/promises'
import { join, posix, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { extractDts, extractRuntime, resolvePackageEntriesSync } from 'tsnapi'
import { describe, expect, it } from 'vitest'

// Snapshots the public API of each package.json entry point,
// as extracted from the built output in dist:
// runtime exports, type declarations, and importability.
// Update the snapshots when updating the API with `pnpm test:unit -u`
// (and adjust the documentation accordingly).

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const distRoot = join(packageRoot, 'dist')
const snapshotRoot = join(packageRoot, 'tests', 'snapshots')
const entries = resolvePackageEntriesSync(packageRoot)
const chunkSources = await loadChunkSources()

async function loadChunkSources() {
  const files = (await readdir(distRoot, { recursive: true }))
    .map(file => file.split(sep).join('/'))
    .filter(path => path.endsWith('.d.ts') || path.endsWith('.js'))
    .sort()
  const sources = await Promise.all(
    files.map(
      async path =>
        [path, await readFile(join(distRoot, path), 'utf-8')] as const
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
// This shim could be upstreamed as a tsnapi option (see issue #1059).
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
        const code = canonicalizeSpecifiers(
          distSource(chunkSources.runtime, `./${path}`),
          posix.dirname(path),
          '.js'
        )
        const snapshot = await extractRuntime(path, code, {
          chunkSources: chunkSources.runtime
        })
        await expect(normalize(snapshot)).toMatchFileSnapshot(
          join(snapshotRoot, `${stem}.snapshot.js`)
        )
      })
      it(`${entry.name} (import)`, async () => {
        await expect(
          import(pathToFileURL(runtimeFile).href)
        ).resolves.toBeDefined()
      })
    }
    if (entry.dts) {
      const path = relative(distRoot, entry.dts).split(sep).join('/')
      it(`${entry.name} (types)`, async () => {
        const key = `./${path.replace(/\.d\.ts$/, '.d.mts')}`
        const code = canonicalizeSpecifiers(
          distSource(chunkSources.dts, key),
          posix.dirname(path),
          '.d.mts'
        )
        const snapshot = await extractDts(path, code, {
          chunkSources: chunkSources.dts
        })
        await expect(normalize(snapshot)).toMatchFileSnapshot(
          join(snapshotRoot, `${stem}.snapshot.d.ts`)
        )
      })
    }
  }

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
