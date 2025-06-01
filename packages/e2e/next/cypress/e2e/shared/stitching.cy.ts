import { testStitching } from 'e2e-shared/specs/stitching.cy'

testStitching({
  path: '/app/stitching',
  nextJsRouter: 'app'
})

testStitching({
  path: '/pages/stitching',
  nextJsRouter: 'pages'
})
