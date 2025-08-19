import { testRepro982 } from 'e2e-shared/specs/repro-982.cy'

testRepro982({
  path: '/app/repro-982',
  nextJsRouter: 'app'
})

testRepro982({
  path: '/pages/repro-982',
  nextJsRouter: 'pages'
})
