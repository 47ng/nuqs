import { testRepro1444 } from 'e2e-shared/specs/repro-1444.spec.ts'

testRepro1444({
  path: '/app/repro-1444',
  router: 'next-app'
})

testRepro1444({
  path: '/pages/repro-1444',
  router: 'next-pages'
})
