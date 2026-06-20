import { test } from '@playwright/test'
import { createRequire } from 'node:module'
import { testRepro1444 } from 'e2e-shared/specs/repro-1444.spec.ts'

// <Activity> requires React 19.2+, which Next only bundles into its app-router
// runtime from v16. On older majors the `Activity` import resolves to undefined
// and the route crashes when rendered, so this repro can only run on Next >= 16
// — mirroring how cacheComponents is gated to the versions that support it.
const nextMajor = Number.parseInt(
  createRequire(import.meta.url)('next/package.json').version,
  10
)

if (nextMajor >= 16) {
  testRepro1444({
    path: '/app/repro-1444',
    router: 'next-app'
  })

  testRepro1444({
    path: '/pages/repro-1444',
    router: 'next-pages'
  })
} else {
  test.describe.skip(
    `repro-1444 - requires Next >= 16 for <Activity> (got Next ${nextMajor})`,
    () => {
      test('Activity stale value reconciliation', () => {})
    }
  )
}
