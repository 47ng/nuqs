import { testScroll } from 'e2e-shared/specs/scroll.cy'

testScroll({
  path: '/app/scroll',
  nextJsRouter: 'app'
})

testScroll({
  path: '/pages/scroll',
  nextJsRouter: 'pages'
})
