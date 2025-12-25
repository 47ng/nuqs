import { testHashPreservation } from 'e2e-shared/specs/hash-preservation.spec.ts'

testHashPreservation({
  path: '/app/hash-preservation/dynamic/route',
  router: 'next-app',
  description: 'dynamic route'
})

testHashPreservation({
  path: '/pages/hash-preservation/dynamic/route',
  router: 'next-pages',
  description: 'dynamic route'
})
