import { testFlushAfterNavigate } from 'e2e-shared/specs/flush-after-navigate.cy'

// todo: Make it work with app router
// testFlushAfterNavigate({
//   path: '/app/flush-after-navigate',
//   nextJsRouter: 'app'
// })

testFlushAfterNavigate({
  path: '/pages/flush-after-navigate',
  nextJsRouter: 'pages'
})
