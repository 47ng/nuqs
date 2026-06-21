import { testFlushAfterNavigate } from 'e2e-shared/specs/flush-after-navigate.spec.ts'

testFlushAfterNavigate({
  path: '/app/flush-after-navigate/useQueryState',
  router: 'next-app',
  hook: 'useQueryState'
})

testFlushAfterNavigate({
  path: '/app/flush-after-navigate/useQueryStates',
  router: 'next-app',
  hook: 'useQueryStates'
})

testFlushAfterNavigate({
  path: '/pages/flush-after-navigate/useQueryState',
  router: 'next-pages',
  hook: 'useQueryState'
})

testFlushAfterNavigate({
  path: '/pages/flush-after-navigate/useQueryStates',
  router: 'next-pages',
  hook: 'useQueryStates'
})
