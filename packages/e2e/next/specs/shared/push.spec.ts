import { testPush } from 'e2e-shared/specs/push.spec.ts'

testPush({
  path: '/app/push/useQueryState',
  hook: 'useQueryState',
  router: 'next-app',
  description: 'standard route'
})

testPush({
  path: '/app/push/useQueryStates',
  hook: 'useQueryStates',
  router: 'next-app',
  description: 'standard route'
})

testPush({
  path: '/pages/push/useQueryState',
  hook: 'useQueryState',
  router: 'next-pages',
  description: 'standard route'
})

testPush({
  path: '/pages/push/useQueryStates',
  hook: 'useQueryStates',
  router: 'next-pages',
  description: 'standard route'
})

// --

testPush({
  path: '/app/push/useQueryState/dynamic/route',
  hook: 'useQueryState',
  router: 'next-app',
  description: 'dynamic route'
})

testPush({
  path: '/app/push/useQueryStates/dynamic/route',
  hook: 'useQueryStates',
  router: 'next-app',
  description: 'dynamic route'
})

testPush({
  path: '/pages/push/useQueryState/dynamic/route',
  hook: 'useQueryState',
  router: 'next-pages',
  description: 'dynamic route'
})

testPush({
  path: '/pages/push/useQueryStates/dynamic/route',
  hook: 'useQueryStates',
  router: 'next-pages',
  description: 'dynamic route'
})
