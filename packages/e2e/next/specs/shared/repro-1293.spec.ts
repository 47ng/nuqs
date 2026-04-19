import { testRepro1293 } from 'e2e-shared/specs/repro-1293.spec.ts'

testRepro1293({
  path: '/app/repro-1293',
  router: 'next-app'
})

testRepro1293({
  path: '/pages/repro-1293',
  router: 'next-pages'
})
