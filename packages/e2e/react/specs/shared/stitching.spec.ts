import { testStitching } from 'e2e-shared/specs/stitching.spec.ts'

testStitching({
  path: '/stitching',
  // React SPA doesn't have full page navigation on shallow: false
  enableShallowFalse: false
})
