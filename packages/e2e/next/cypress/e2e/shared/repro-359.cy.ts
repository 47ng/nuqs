import { testRepro359 } from 'e2e-shared/specs/repro-359.cy'

testRepro359({
  path: '/app/repro-359',
  nextJsRouter: 'app'
})

testRepro359({
  path: '/pages/repro-359',
  nextJsRouter: 'pages'
})
