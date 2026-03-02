import { testFlushAfterNavigate } from 'e2e-shared/specs/flush-after-navigate.spec.ts'

testFlushAfterNavigate({
  path: '/flush-after-navigate/useQueryState',
  hook: 'useQueryState'
})

testFlushAfterNavigate({
  path: '/flush-after-navigate/useQueryStates',
  hook: 'useQueryStates'
})
