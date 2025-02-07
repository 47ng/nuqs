import { testShallow } from 'e2e-shared/specs/shallow.cy'

testShallow({
  path: '/app/shallow/useQueryState',
  hook: 'useQueryState',
  nextJsRouter: 'app'
})

testShallow({
  path: '/app/shallow/useQueryStates',
  hook: 'useQueryStates',
  nextJsRouter: 'app'
})

testShallow({
  path: '/pages/shallow/useQueryState',
  hook: 'useQueryState',
  nextJsRouter: 'pages'
})

testShallow({
  path: '/pages/shallow/useQueryStates',
  hook: 'useQueryStates',
  nextJsRouter: 'pages'
})
