import { testDynamicSegments } from 'e2e-shared/specs/dynamic-segments.cy'

testDynamicSegments({
  path: '/app/dynamic-segments/dynamic/segment',
  expectedSegments: ['segment'],
  nextJsRouter: 'app'
})

testDynamicSegments({
  path: '/pages/dynamic-segments/dynamic/segment',
  expectedSegments: ['segment'],
  nextJsRouter: 'pages'
})

// Catch-all --

testDynamicSegments({
  path: '/app/dynamic-segments/catch-all/foo',
  expectedSegments: ['foo'],
  nextJsRouter: 'app'
})

testDynamicSegments({
  path: '/pages/dynamic-segments/catch-all/foo',
  expectedSegments: ['foo'],
  nextJsRouter: 'pages'
})

testDynamicSegments({
  path: '/app/dynamic-segments/catch-all/a/b/c',
  expectedSegments: ['a', 'b', 'c'],
  nextJsRouter: 'app'
})

testDynamicSegments({
  path: '/pages/dynamic-segments/catch-all/a/b/c',
  expectedSegments: ['a', 'b', 'c'],
  nextJsRouter: 'pages'
})

// Optional catch-all --

testDynamicSegments({
  path: '/app/dynamic-segments/optional-catch-all', // no segments
  expectedSegments: [],
  nextJsRouter: 'app'
})

testDynamicSegments({
  path: '/pages/dynamic-segments/optional-catch-all', // no segments
  expectedSegments: [],
  nextJsRouter: 'pages'
})

testDynamicSegments({
  path: '/app/dynamic-segments/optional-catch-all/foo',
  expectedSegments: ['foo'],
  nextJsRouter: 'app'
})

testDynamicSegments({
  path: '/pages/dynamic-segments/optional-catch-all/foo',
  expectedSegments: ['foo'],
  nextJsRouter: 'pages'
})

testDynamicSegments({
  path: '/app/dynamic-segments/optional-catch-all/a/b/c',
  expectedSegments: ['a', 'b', 'c'],
  nextJsRouter: 'app'
})

testDynamicSegments({
  path: '/pages/dynamic-segments/optional-catch-all/a/b/c',
  expectedSegments: ['a', 'b', 'c'],
  nextJsRouter: 'pages'
})
