import { testShallow } from 'e2e-shared/specs/shallow.spec.ts'

testShallow({
  path: '/app/shallow/useQueryState',
  hook: 'useQueryState',
  router: 'next-app'
})

testShallow({
  path: '/app/shallow/useQueryStates',
  hook: 'useQueryStates',
  router: 'next-app'
})

testShallow({
  path: '/pages/shallow/useQueryState',
  hook: 'useQueryState',
  router: 'next-pages'
})

testShallow({
  path: '/pages/shallow/useQueryStates',
  hook: 'useQueryStates',
  router: 'next-pages'
})
