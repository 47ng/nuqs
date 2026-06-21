import { testShallow } from 'e2e-shared/specs/shallow.spec.ts'

testShallow({
  path: '/shallow/useQueryState',
  hook: 'useQueryState',
  supportsSSR: false
})

testShallow({
  path: '/shallow/useQueryStates',
  hook: 'useQueryStates',
  supportsSSR: false
})
