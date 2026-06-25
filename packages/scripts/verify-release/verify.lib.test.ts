import { describe, expect, it, vi } from 'vitest'
import {
  type Reproduction,
  type Toolchain,
  type Verifier,
  checkGitHead,
  fetchRegistryMeta,
  normalizeTag,
  parseToolchain,
  verdictFor,
  verifyReproducibility
} from './verify.lib.ts'

const PINS: Toolchain = { node: '24.11.0', npm: '11.16.0', pnpm: '11.0.9' }

const REPRO: Reproduction = {
  integrity: 'sha512-AAAA',
  shasum: 'a'.repeat(40),
  localTgz: '/out/local.tgz'
}

function fakeVerifier(overrides: Partial<Verifier> = {}): Verifier {
  return {
    readToolchainPins: () => PINS,
    buildImage: () => {},
    readSandboxToolchain: () => PINS,
    reproduce: async () => REPRO,
    ...overrides
  }
}

describe('verifyReproducibility', () => {
  it('reports mismatch when the reproduced sha1 differs from the expected', async () => {
    const verifier = fakeVerifier({
      reproduce: async () => ({ ...REPRO, shasum: 'b'.repeat(40) })
    })
    const outcome = await verifyReproducibility(
      {
        ref: 'v1.2.3',
        pkg: 'nuqs',
        version: '1.2.3',
        integrity: 'sha512-AAAA',
        shasum: 'a'.repeat(40)
      },
      verifier
    )
    expect(outcome).toEqual({
      kind: 'mismatch',
      reproduced: { ...REPRO, shasum: 'b'.repeat(40) },
      expected: { integrity: 'sha512-AAAA', shasum: 'a'.repeat(40) }
    })
  })

  it('reports match and reproduces from the requested ref/pkg/version', async () => {
    const reproduce = vi.fn(async () => REPRO)
    const outcome = await verifyReproducibility(
      {
        ref: 'v1.2.3',
        pkg: 'nuqs',
        version: '1.2.3',
        integrity: REPRO.integrity,
        shasum: REPRO.shasum
      },
      fakeVerifier({ reproduce })
    )
    expect(outcome).toEqual({
      kind: 'match',
      reproduced: REPRO,
      expected: { integrity: REPRO.integrity, shasum: REPRO.shasum }
    })
    expect(reproduce).toHaveBeenCalledExactlyOnceWith({
      ref: 'v1.2.3',
      pkg: 'nuqs',
      version: '1.2.3'
    })
  })

  // integrity (sha512) is the required anchor: a sha1 that agrees while the
  // sha512 diverges is exactly the shape of a collision attempt, and is rejected.
  it('reports mismatch when integrity (the anchor) diverges even if sha1 agrees', async () => {
    const outcome = await verifyReproducibility(
      {
        ref: 'v1.2.3',
        pkg: 'nuqs',
        version: '1.2.3',
        integrity: 'sha512-EXPECTED',
        shasum: REPRO.shasum
      },
      fakeVerifier({
        reproduce: async () => ({ ...REPRO, integrity: 'sha512-ACTUAL' })
      })
    )
    expect(outcome).toMatchObject({ kind: 'mismatch' })
  })

  it('short-circuits on a toolchain mismatch without reproducing', async () => {
    const reproduce = vi.fn(async () => REPRO)
    const outcome = await verifyReproducibility(
      {
        ref: 'v1.2.3',
        pkg: 'nuqs',
        version: '1.2.3',
        integrity: REPRO.integrity,
        shasum: REPRO.shasum
      },
      fakeVerifier({
        readSandboxToolchain: () => ({ ...PINS, node: '24.10.0' }),
        reproduce
      })
    )
    expect(outcome).toEqual({
      kind: 'toolchain-mismatch',
      want: PINS,
      got: { ...PINS, node: '24.10.0' }
    })
    expect(reproduce).not.toHaveBeenCalled()
  })
})

describe('parseToolchain', () => {
  it('extracts node/npm/pnpm, tolerating a leading v and whitespace', () => {
    expect(
      parseToolchain({
        nodeVersion: 'v24.11.0\n',
        npmVersion: '  11.16.0  ',
        packageJson: JSON.stringify({ packageManager: 'pnpm@11.0.9' })
      })
    ).toEqual({ node: '24.11.0', npm: '11.16.0', pnpm: '11.0.9' })
  })

  it('reads pnpm from packageManager with a trailing hash suffix', () => {
    expect(
      parseToolchain({
        nodeVersion: '24.11.0',
        npmVersion: '11.16.0',
        packageJson: JSON.stringify({
          packageManager: 'pnpm@11.0.9+sha512.abc'
        })
      }).pnpm
    ).toBe('11.0.9')
  })

  it('throws naming the offending field when a pin is not x.y.z', () => {
    expect(() =>
      parseToolchain({
        nodeVersion: 'lts/iron',
        npmVersion: '11.16.0',
        packageJson: JSON.stringify({ packageManager: 'pnpm@11.0.9' })
      })
    ).toThrow(/node/)
  })

  it('throws when packageManager names a different manager', () => {
    expect(() =>
      parseToolchain({
        nodeVersion: '24.11.0',
        npmVersion: '11.16.0',
        packageJson: JSON.stringify({ packageManager: 'yarn@4.0.0' })
      })
    ).toThrow(/pnpm/)
  })
})

describe('normalizeTag', () => {
  it('accepts a v-prefixed tag', () => {
    expect(normalizeTag('v2.8.9')).toEqual({ tag: 'v2.8.9', version: '2.8.9' })
  })

  it('accepts a bare version and adds the tag prefix', () => {
    expect(normalizeTag('2.8.9')).toEqual({ tag: 'v2.8.9', version: '2.8.9' })
  })

  it('preserves a prerelease suffix and tolerates whitespace', () => {
    expect(normalizeTag('  v2.9.0-beta.1 ')).toEqual({
      tag: 'v2.9.0-beta.1',
      version: '2.9.0-beta.1'
    })
  })

  it('rejects junk and partial versions', () => {
    expect(() => normalizeTag('latest')).toThrow()
    expect(() => normalizeTag('v1.2')).toThrow()
  })
})

describe('checkGitHead', () => {
  const commit = 'f3e2d176d549f38f00daa765e6cd1c83cc826174'

  it('is ok when the registry gitHead equals the tag commit', () => {
    expect(checkGitHead(commit, commit)).toEqual({ kind: 'ok' })
  })

  it('is absent (warn, continue) when the registry has no gitHead', () => {
    expect(checkGitHead(undefined, commit)).toEqual({ kind: 'absent' })
  })

  it('is mismatch when gitHead points elsewhere than the tag', () => {
    expect(checkGitHead('0'.repeat(40), commit)).toEqual({
      kind: 'mismatch',
      gitHead: '0'.repeat(40),
      tagCommit: commit
    })
  })
})

describe('fetchRegistryMeta', () => {
  const validBody = {
    version: '2.8.9',
    gitHead: 'f3e2d176d549f38f00daa765e6cd1c83cc826174',
    dist: {
      integrity: 'sha512-8ou6AEwsxMWSYo2qkfZtYFVzngwbKmg4c00HVxC',
      shasum: 'e2c27d87c0dd0e3b4412fe867bcd0947cc4c998f',
      tarball: 'https://registry.npmjs.org/nuqs/-/nuqs-2.8.9.tgz'
    }
  }
  const okFetch = (body: unknown): typeof fetch =>
    vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }))

  it('reads digests + gitHead from the canonical registry URL', async () => {
    const fetchFn = okFetch(validBody)
    const meta = await fetchRegistryMeta('nuqs', '2.8.9', fetchFn)
    expect(meta.dist.integrity).toBe(validBody.dist.integrity)
    expect(meta.dist.shasum).toBe(validBody.dist.shasum)
    expect(meta.gitHead).toBe(validBody.gitHead)
    expect(fetchFn).toHaveBeenCalledExactlyOnceWith(
      'https://registry.npmjs.org/nuqs/2.8.9'
    )
  })

  it('throws a clear not-published error on 404', async () => {
    const fetchFn: typeof fetch = vi.fn(
      async () => new Response(null, { status: 404 })
    )
    await expect(fetchRegistryMeta('nuqs', '9.9.9', fetchFn)).rejects.toThrow(
      /not published/i
    )
  })

  it('throws on other non-OK statuses', async () => {
    const fetchFn: typeof fetch = vi.fn(
      async () => new Response(null, { status: 503 })
    )
    await expect(fetchRegistryMeta('nuqs', '2.8.9', fetchFn)).rejects.toThrow(
      /503/
    )
  })

  it('rejects a payload whose shasum is not a 40-char sha1', async () => {
    const bad = { ...validBody, dist: { ...validBody.dist, shasum: 'nope' } }
    await expect(
      fetchRegistryMeta('nuqs', '2.8.9', okFetch(bad))
    ).rejects.toThrow()
  })
})

describe('verdictFor', () => {
  const ctx = { pkg: 'nuqs', version: '2.8.9', ref: 'v2.8.9' }

  it('passes with exit 0 and shows reproduced vs published digests for visual matching', () => {
    const v = verdictFor(
      {
        kind: 'match',
        reproduced: {
          integrity: 'sha512-SAME',
          shasum: 'a'.repeat(40),
          localTgz: '/out/local.tgz'
        },
        expected: { integrity: 'sha512-SAME', shasum: 'a'.repeat(40) }
      },
      ctx
    )
    expect(v.code).toBe(0)
    expect(v.ok).toBe(true)
    expect(v.summary).toContain('nuqs')
    expect(v.summary).toContain('2.8.9')
    expect(v.summary).toContain('v2.8.9')
    const body = v.details.join('\n')
    expect(body).toContain('a'.repeat(40)) // shown even on PASS
    expect(body).toContain('sha512-SAME')
  })

  it('fails with exit 1 and shows reproduced vs published digests on mismatch', () => {
    const v = verdictFor(
      {
        kind: 'mismatch',
        reproduced: {
          integrity: 'sha512-LOCAL',
          shasum: 'b'.repeat(40),
          localTgz: '/out/local.tgz'
        },
        expected: { integrity: 'sha512-PUBLISHED', shasum: 'a'.repeat(40) }
      },
      ctx
    )
    expect(v.code).toBe(1)
    expect(v.ok).toBe(false)
    const body = v.details.join('\n')
    expect(body).toContain('b'.repeat(40)) // reproduced
    expect(body).toContain('a'.repeat(40)) // published
  })

  it('exits 2 (could-not-complete, not a tampered verdict) on toolchain mismatch', () => {
    const v = verdictFor(
      {
        kind: 'toolchain-mismatch',
        want: { node: '24.11.0', npm: '11.16.0', pnpm: '11.0.9' },
        got: { node: '24.10.0', npm: '11.16.0', pnpm: '11.0.9' }
      },
      ctx
    )
    expect(v.code).toBe(2)
    expect(v.ok).toBe(false)
    const body = v.details.join('\n')
    expect(body).toContain('24.11.0')
    expect(body).toContain('24.10.0')
  })
})
