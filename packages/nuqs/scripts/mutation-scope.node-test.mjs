import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const temporaryDirectories = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(path => rm(path, { recursive: true }))
  )
})

it('records JavaScript and TypeScript source files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nuqs-mutation-scope-'))
  temporaryDirectories.push(root)
  const sourceDirectory = join(root, 'src')
  const reportDirectory = join(root, 'reports', 'mutation')
  const cacheDirectory = join(reportDirectory, 'cache')
  await mkdir(sourceDirectory, { recursive: true })
  await mkdir(cacheDirectory, { recursive: true })

  const extensions = ['cjs', 'cts', 'js', 'jsx', 'mjs', 'mts', 'ts', 'tsx']
  await Promise.all(
    extensions.map(extension =>
      writeFile(join(sourceDirectory, `example.${extension}`), '')
    )
  )
  await writeFile(join(sourceDirectory, 'ignored.json'), '')
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({ scripts: { mutation: 'node scripts/mutation.mjs' } })
  )

  const reportPath = join(reportDirectory, 'stryker-incremental.json')
  await writeFile(
    reportPath,
    JSON.stringify({ config: { strategy: 'runtime-ownership-v1' }, files: {} })
  )
  const runtimeReport = {
    files: {},
    testFiles: {},
    config: { mutator: { excludedMutations: [] }, ignorePatterns: [] }
  }
  await Promise.all(
    ['node', 'browser'].map(runtime =>
      writeFile(
        join(cacheDirectory, `${runtime}.json`),
        JSON.stringify(runtimeReport)
      )
    )
  )

  await execute(process.execPath, [
    fileURLToPath(new URL('./mutation-scope.mjs', import.meta.url)),
    root,
    reportPath
  ])

  const report = JSON.parse(await readFile(reportPath, 'utf8'))
  assert.deepEqual(
    report.config.scope.sourceFiles,
    extensions.map(extension => `src/example.${extension}`).sort()
  )
})
