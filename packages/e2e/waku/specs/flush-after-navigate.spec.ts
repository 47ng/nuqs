import { testFlushAfterNavigate } from 'e2e-shared/specs/flush-after-navigate.spec.ts'

testFlushAfterNavigate({
  path: `${''}/flush-after-navigate/useQueryState`,
  hook: 'useQueryState',
  router: 'waku',
  description: 'static'
})

testFlushAfterNavigate({
  path: `${'/dynamic'}/flush-after-navigate/useQueryState`,
  hook: 'useQueryState',
  router: 'waku',
  description: 'dynamic'
})

testFlushAfterNavigate({
  path: `${''}/flush-after-navigate/useQueryStates`,
  hook: 'useQueryStates',
  router: 'waku',
  description: 'static'
})

testFlushAfterNavigate({
  path: `${'/dynamic'}/flush-after-navigate/useQueryStates`,
  hook: 'useQueryStates',
  router: 'waku',
  description: 'dynamic'
})
