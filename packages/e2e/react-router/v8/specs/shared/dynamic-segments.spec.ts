import { testDynamicSegments } from 'e2e-shared/specs/dynamic-segments.spec.ts'

testDynamicSegments({
  path: '/dynamic-segments/dynamic/foo',
  expectedSegments: ['foo']
})

testDynamicSegments({
  path: '/dynamic-segments/catch-all',
  expectedSegments: ['']
})

testDynamicSegments({
  path: '/dynamic-segments/catch-all/a/b/c',
  expectedSegments: ['a', 'b', 'c']
})
