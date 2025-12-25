import { testRepro982 } from 'e2e-shared/specs/repro-982.spec.ts'

testRepro982({
  path: '/app/repro-982',
  router: 'next-app'
})

testRepro982({
  path: '/pages/repro-982',
  router: 'next-pages'
})
