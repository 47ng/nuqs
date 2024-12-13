import { testHashPreservation } from 'e2e-shared/specs/hash-preservation.cy'

testHashPreservation({
  path: '/app/hash-preservation',
  nextJsRouter: 'app',
  description: 'standard route'
})

testHashPreservation({
  path: '/app/hash-preservation/dynamic/route',
  nextJsRouter: 'app',
  description: 'dynamic route'
})

testHashPreservation({
  path: '/pages/hash-preservation',
  nextJsRouter: 'pages',
  description: 'standard route'
})

testHashPreservation({
  path: '/pages/hash-preservation/dynamic/route',
  nextJsRouter: 'pages',
  description: 'dynamic route'
})
