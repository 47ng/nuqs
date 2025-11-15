import { testPush } from 'e2e-shared/specs/push.cy'

testPush({
  path: '/push/useQueryState',
  hook: 'useQueryState'
})

testPush({
  path: '/push/useQueryStates',
  hook: 'useQueryStates'
})
