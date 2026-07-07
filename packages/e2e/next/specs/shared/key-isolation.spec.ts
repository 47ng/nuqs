import { testKeyIsolation } from 'e2e-shared/specs/key-isolation.spec.ts'

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
