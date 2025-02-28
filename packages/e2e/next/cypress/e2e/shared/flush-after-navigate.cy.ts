import { testFlushAfterNavigate } from 'e2e-shared/specs/flush-after-navigate.cy'

testFlushAfterNavigate({
  path: '/app/flush-after-navigate',
  nextJsRouter: 'app'
})

testFlushAfterNavigate({
  path: '/pages/flush-after-navigate',
  nextJsRouter: 'pages'
})
