import { testShallow } from 'e2e-shared/specs/shallow.cy'

testShallow({
  path: '/shallow/useQueryState',
  hook: 'useQueryState'
})

testShallow({
  path: '/shallow/useQueryStates',
  hook: 'useQueryStates'
})
