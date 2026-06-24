import { testRepro1358 } from 'e2e-shared/specs/repro-1358.spec.ts'

testRepro1358({
  path: '/app/repro-1358',
  router: 'next-app'
})

testRepro1358({
  path: '/pages/repro-1358',
  router: 'next-pages'
})
