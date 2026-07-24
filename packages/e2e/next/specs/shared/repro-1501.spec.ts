import { testRepro1501 } from 'e2e-shared/specs/repro-1501.spec.ts'

testRepro1501({
  path: '/app/repro-1501',
  router: 'next-app'
})

testRepro1501({
  path: '/pages/repro-1501',
  router: 'next-pages'
})
