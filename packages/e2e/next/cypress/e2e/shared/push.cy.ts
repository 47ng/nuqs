import { testPush } from 'e2e-shared/specs/push.cy'

testPush({
  path: '/app/push/useQueryState',
  hook: 'useQueryState',
  nextJsRouter: 'app',
  description: 'standard route'
})

testPush({
  path: '/app/push/useQueryStates',
  hook: 'useQueryStates',
  nextJsRouter: 'app',
  description: 'standard route'
})

testPush({
  path: '/pages/push/useQueryState',
  hook: 'useQueryState',
  nextJsRouter: 'pages',
  description: 'standard route'
})

testPush({
  path: '/pages/push/useQueryStates',
  hook: 'useQueryStates',
  nextJsRouter: 'pages',
  description: 'standard route'
})

// --

testPush({
  path: '/app/push/useQueryState/dynamic/route',
  hook: 'useQueryState',
  nextJsRouter: 'app',
  description: 'dynamic route'
})

testPush({
  path: '/app/push/useQueryStates/dynamic/route',
  hook: 'useQueryStates',
  nextJsRouter: 'app',
  description: 'dynamic route'
})

testPush({
  path: '/pages/push/useQueryState/dynamic/route',
  hook: 'useQueryState',
  nextJsRouter: 'pages',
  description: 'dynamic route'
})

testPush({
  path: '/pages/push/useQueryStates/dynamic/route',
  hook: 'useQueryStates',
  nextJsRouter: 'pages',
  description: 'dynamic route'
})
