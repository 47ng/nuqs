import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveGithubToken } from './with-github-token.mjs'

test('keeps an explicitly provided GitHub token', async () => {
  let calls = 0
  const token = await resolveGithubToken({
    env: { GITHUB_TOKEN: 'from-env' },
    readGhToken: async () => {
      calls++
      return 'from-gh'
    }
  })

  assert.equal(token, 'from-env')
  assert.equal(calls, 0)
})

test('uses the GitHub CLI credential without persisting it', async () => {
  const token = await resolveGithubToken({
    env: {},
    readGhToken: async () => 'from-gh\n'
  })

  assert.equal(token, 'from-gh')
})

test('fails before a docs command when no GitHub credential is available', async () => {
  await assert.rejects(
    resolveGithubToken({
      env: {},
      readGhToken: async () => {
        throw new Error('not logged in')
      }
    }),
    /Set GITHUB_TOKEN or authenticate gh/
  )
})
