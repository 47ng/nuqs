import { testRepro702 } from 'e2e-shared/specs/repro-702.cy'

testRepro702({
  path: '/app/repro-702',
  nextJsRouter: 'app'
})

testRepro702({
  path: '/pages/repro-702',
  nextJsRouter: 'pages'
})
