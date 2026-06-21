import { testRepro359 } from 'e2e-shared/specs/repro-359.spec.ts'

testRepro359({
  path: '/app/repro-359',
  router: 'next-app'
})

testRepro359({
  path: '/pages/repro-359',
  router: 'next-pages'
})
