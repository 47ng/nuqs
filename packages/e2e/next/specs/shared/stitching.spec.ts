import { testStitching } from 'e2e-shared/specs/stitching.spec.ts'

testStitching({
  path: '/app/stitching',
  router: 'next-app'
})

testStitching({
  path: '/pages/stitching',
  router: 'next-pages'
})
