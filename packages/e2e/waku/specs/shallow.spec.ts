import { testShallow } from 'e2e-shared/specs/shallow.spec.ts'

testShallow({
  path: '/shallow/useQueryState',
  hook: 'useQueryState',
  router: 'waku',
  description: 'static',
  supportsSSR: false
})

testShallow({
  path: '/dynamic/shallow/useQueryState',
  hook: 'useQueryState',
  router: 'waku',
  description: 'dynamic'
})

testShallow({
  path: '/shallow/useQueryStates',
  hook: 'useQueryStates',
  router: 'waku',
  description: 'static',
  supportsSSR: false
})

testShallow({
  path: '/dynamic/shallow/useQueryStates',
  hook: 'useQueryStates',
  router: 'waku',
  description: 'dynamic'
})
