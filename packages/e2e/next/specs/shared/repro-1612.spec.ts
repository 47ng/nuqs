import { testRepro1612 } from 'e2e-shared/specs/repro-1612.spec.ts'

testRepro1612({
  path: '/app/repro-1612',
  router: 'next-app'
})

testRepro1612({
  path: '/pages/repro-1612',
  router: 'next-pages'
})
