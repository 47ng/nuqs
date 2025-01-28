import { testBasicIO } from 'e2e-shared/specs/basic-io.cy'

testBasicIO({
  hook: 'useQueryState',
  path: '/app/basic-io/useQueryState',
  nextJsRouter: 'app'
})

testBasicIO({
  hook: 'useQueryStates',
  path: '/app/basic-io/useQueryStates',
  nextJsRouter: 'app'
})

testBasicIO({
  hook: 'useQueryState',
  path: '/pages/basic-io/useQueryState',
  nextJsRouter: 'pages'
})

testBasicIO({
  hook: 'useQueryStates',
  path: '/pages/basic-io/useQueryStates',
  nextJsRouter: 'pages'
})

// Test the agnostic adapter

testBasicIO({
  hook: 'useQueryState',
  path: '/app/agnostic/basic-io',
  nextJsRouter: 'app',
  description: 'Agnostic adapter'
})

testBasicIO({
  hook: 'useQueryState',
  path: '/pages/agnostic/basic-io',
  nextJsRouter: 'pages',
  description: 'Agnostic adapter'
})
