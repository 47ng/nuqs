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
