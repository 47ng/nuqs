import { testRouting } from 'e2e-shared/specs/routing.cy'

testRouting({
  path: '/app/routing/useQueryState',
  hook: 'useQueryState',
  nextJsRouter: 'app'
})

testRouting({
  path: '/app/routing/useQueryStates',
  hook: 'useQueryStates',
  nextJsRouter: 'app'
})

testRouting({
  path: '/pages/routing/useQueryState',
  hook: 'useQueryState',
  nextJsRouter: 'pages'
})

testRouting({
  path: '/pages/routing/useQueryStates',
  hook: 'useQueryStates',
  nextJsRouter: 'pages'
})
