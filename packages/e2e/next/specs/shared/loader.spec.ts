import { testLoader } from 'e2e-shared/specs/loader.spec.ts'

// In page components:

testLoader({
  path: '/app/loader',
  router: 'next-app',
  description: 'Loads from page component'
})

testLoader({
  path: '/pages/loader',
  router: 'next-pages',
  description: 'Loads from page component'
})

// In API routes:

testLoader({
  path: '/api/app/loader',
  router: 'next-app',
  description: 'Loads from API route'
})

testLoader({
  path: '/api/pages/loader',
  router: 'next-pages',
  description: 'Loads from API route'
})
