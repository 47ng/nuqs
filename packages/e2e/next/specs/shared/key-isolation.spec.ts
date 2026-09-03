import { testBasicIO } from 'e2e-shared/specs/basic-io.spec.ts'
import { testKeyIsolation } from 'e2e-shared/specs/key-isolation.spec.ts'
import { testPopstateQueueReset } from 'e2e-shared/specs/popstate-queue-reset.spec.ts'
import { testPush } from 'e2e-shared/specs/push.spec.ts'
import { testRepro1293 } from 'e2e-shared/specs/repro-1293.spec.ts'
import { testShallow } from 'e2e-shared/specs/shallow.spec.ts'

testKeyIsolation({
  path: '/app/key-isolation/useQueryState',
  router: 'next-app',
  hook: 'useQueryState'
})

testKeyIsolation({
  path: '/app/key-isolation/useQueryStates',
  router: 'next-app',
  hook: 'useQueryStates'
})

testKeyIsolation({
  path: '/pages/key-isolation/useQueryState',
  router: 'next-pages',
  hook: 'useQueryState'
})

testKeyIsolation({
  path: '/pages/key-isolation/useQueryStates',
  router: 'next-pages',
  hook: 'useQueryStates'
})

const description = 'key isolation'

testBasicIO({
  path: '/app/key-isolation/basic-io',
  router: 'next-app',
  hook: 'useQueryState',
  description
})

testBasicIO({
  path: '/pages/key-isolation/basic-io',
  router: 'next-pages',
  hook: 'useQueryState',
  description
})

testShallow({
  path: '/app/key-isolation/shallow',
  router: 'next-app',
  hook: 'useQueryState',
  description
})

testShallow({
  path: '/pages/key-isolation/shallow',
  router: 'next-pages',
  hook: 'useQueryState',
  description
})

testPush({
  path: '/app/key-isolation/push',
  router: 'next-app',
  hook: 'useQueryState',
  description
})

testPush({
  path: '/pages/key-isolation/push',
  router: 'next-pages',
  hook: 'useQueryState',
  description
})

testRepro1293({
  path: '/app/key-isolation/repro-1293',
  router: 'next-app',
  description
})

testRepro1293({
  path: '/pages/key-isolation/repro-1293',
  router: 'next-pages',
  description
})

testPopstateQueueReset({
  path: '/app/key-isolation/popstate-queue-reset',
  router: 'next-app',
  description
})

testPopstateQueueReset({
  path: '/pages/key-isolation/popstate-queue-reset',
  router: 'next-pages',
  description
})
