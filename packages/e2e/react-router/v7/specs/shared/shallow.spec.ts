import { testShallow } from 'e2e-shared/specs/shallow.spec.ts'

// Note: React Router v7 supports SSR, so no supportsSSR: false needed
testShallow({
  path: '/shallow/useQueryState',
  hook: 'useQueryState'
})

testShallow({
  path: '/shallow/useQueryStates',
  hook: 'useQueryStates'
})
