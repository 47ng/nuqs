import { testPush } from 'e2e-shared/specs/push.spec.ts'

testPush({
  path: '/push/useQueryState',
  hook: 'useQueryState'
})

testPush({
  path: '/push/useQueryStates',
  hook: 'useQueryStates'
})
