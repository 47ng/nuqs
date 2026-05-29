import { testRepro1273 } from 'e2e-shared/specs/repro-1273.spec.ts'

testRepro1273({
  path: '/app/repro-1273',
  router: 'next-app'
})

testRepro1273({
  path: '/pages/repro-1273',
  router: 'next-pages'
})
