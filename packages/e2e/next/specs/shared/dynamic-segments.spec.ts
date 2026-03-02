import { testDynamicSegments } from 'e2e-shared/specs/dynamic-segments.spec.ts'

testDynamicSegments({
  path: '/app/dynamic-segments/dynamic/segment',
  expectedSegments: ['segment'],
  router: 'next-app'
})

testDynamicSegments({
  path: '/pages/dynamic-segments/dynamic/segment',
  expectedSegments: ['segment'],
  router: 'next-pages'
})

// Catch-all --

testDynamicSegments({
  path: '/app/dynamic-segments/catch-all/foo',
  expectedSegments: ['foo'],
  router: 'next-app'
})

testDynamicSegments({
  path: '/pages/dynamic-segments/catch-all/foo',
  expectedSegments: ['foo'],
  router: 'next-pages'
})

testDynamicSegments({
  path: '/app/dynamic-segments/catch-all/a/b/c',
  expectedSegments: ['a', 'b', 'c'],
  router: 'next-app'
})

testDynamicSegments({
  path: '/pages/dynamic-segments/catch-all/a/b/c',
  expectedSegments: ['a', 'b', 'c'],
  router: 'next-pages'
})

// Optional catch-all --

testDynamicSegments({
  path: '/app/dynamic-segments/optional-catch-all', // no segments
  expectedSegments: [],
  router: 'next-app'
})

testDynamicSegments({
  path: '/pages/dynamic-segments/optional-catch-all', // no segments
  expectedSegments: [],
  router: 'next-pages'
})

testDynamicSegments({
  path: '/app/dynamic-segments/optional-catch-all/foo',
  expectedSegments: ['foo'],
  router: 'next-app'
})

testDynamicSegments({
  path: '/pages/dynamic-segments/optional-catch-all/foo',
  expectedSegments: ['foo'],
  router: 'next-pages'
})

testDynamicSegments({
  path: '/app/dynamic-segments/optional-catch-all/a/b/c',
  expectedSegments: ['a', 'b', 'c'],
  router: 'next-app'
})

testDynamicSegments({
  path: '/pages/dynamic-segments/optional-catch-all/a/b/c',
  expectedSegments: ['a', 'b', 'c'],
  router: 'next-pages'
})
