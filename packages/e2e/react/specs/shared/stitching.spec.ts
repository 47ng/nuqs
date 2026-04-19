import { testStitching } from 'e2e-shared/specs/stitching.spec.ts'

testStitching({
  path: '/stitching',
  enableShallowFalse: process.env.FULL_PAGE_NAV_ON_SHALLOW_FALSE !== 'true'
})
