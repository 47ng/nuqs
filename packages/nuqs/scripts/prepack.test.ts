import { spawnSync } from 'node:child_process'
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { expect, it } from 'vitest'

it('prepares the package when any output contains the version placeholder', async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'nuqs-prepack-'))
  const repoRoot = join(fixtureRoot, 'repo')
  const packageDir = join(repoRoot, 'packages', 'nuqs')
  const scriptsDir = join(packageDir, 'scripts')
  const distDir = join(packageDir, 'dist')
  const binDir = join(fixtureRoot, 'bin')
  try {
    await Promise.all([
      mkdir(scriptsDir, { recursive: true }),
      mkdir(distDir, { recursive: true }),
      mkdir(binDir, { recursive: true })
    ])
    await Promise.all([
      copyFile(
        new URL('./prepack.sh', import.meta.url),
        join(scriptsDir, 'prepack.sh')
      ),
      writeFile(join(repoRoot, 'README.md'), '# Fixture'),
      writeFile(join(repoRoot, 'LICENSE'), 'MIT'),
      writeFile(
        join(packageDir, 'package.json'),
        JSON.stringify({ version: '1.2.3' })
      ),
      writeFile(
        join(distDir, 'with-placeholder.js'),
        'export const version = "0.0.0-inject-version-here"\n'
      ),
      writeFile(
        join(distDir, 'without-placeholder.js'),
        'export const answer = 42\n'
      )
    ])

    const fakeFind = join(binDir, 'find')
    await writeFile(
      fakeFind,
      [
        '#!/usr/bin/env bash',
        'if [[ "$*" == *"grep -q"* ]]; then',
        '  exit 1',
        'fi',
        'exec /usr/bin/find "$@"'
      ].join('\n')
    )
    await Promise.all([
      chmod(join(scriptsDir, 'prepack.sh'), 0o755),
      chmod(fakeFind, 0o755)
    ])

    const result = spawnSync(join(scriptsDir, 'prepack.sh'), {
      cwd: packageDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: binDir + delimiter + process.env.PATH
      }
    })

    expect(result.status, result.stderr).toBe(0)
    await expect(
      readFile(join(distDir, 'with-placeholder.js'), 'utf8')
    ).resolves.toContain('1.2.3')
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true })
  }
})
