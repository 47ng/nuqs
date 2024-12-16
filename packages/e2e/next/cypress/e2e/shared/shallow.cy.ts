import { testShallow } from 'e2e-shared/specs/shallow.cy'

testShallow({
  path: '/app/shallow/useQueryState',
  hook: 'useQueryState',
  testSSR: true,
  nextJsRouter: 'app'
})

testShallow({
  path: '/app/shallow/useQueryStates',
  hook: 'useQueryStates',
  testSSR: true,
  nextJsRouter: 'app'
})

testShallow({
  path: '/pages/shallow/useQueryState',
  hook: 'useQueryState',
  testSSR: true,
  nextJsRouter: 'pages'
})

testShallow({
  path: '/pages/shallow/useQueryStates',
  hook: 'useQueryStates',
  testSSR: true,
  nextJsRouter: 'pages'
})
