import { testRepro1365 } from 'e2e-shared/specs/repro-1365.spec.ts'

testRepro1365({
  path: '/app/repro-1365',
  router: 'next-app'
})

testRepro1365({
  path: '/pages/repro-1365',
  router: 'next-pages'
})
