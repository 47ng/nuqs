import { testFlushAfterNavigate } from 'e2e-shared/specs/flush-after-navigate.cy'

testFlushAfterNavigate({
  path: '/app/flush-after-navigate/useQueryState',
  nextJsRouter: 'app',
  hook: 'useQueryState'
})

testFlushAfterNavigate({
  path: '/app/flush-after-navigate/useQueryStates',
  nextJsRouter: 'app',
  hook: 'useQueryStates'
})

testFlushAfterNavigate({
  path: '/pages/flush-after-navigate/useQueryState',
  nextJsRouter: 'pages',
  hook: 'useQueryState'
})

testFlushAfterNavigate({
  path: '/pages/flush-after-navigate/useQueryStates',
  nextJsRouter: 'pages',
  hook: 'useQueryStates'
})
