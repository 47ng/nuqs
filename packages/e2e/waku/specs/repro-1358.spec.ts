import { testRepro1358 } from 'e2e-shared/specs/repro-1358.spec.ts'

testRepro1358({
  path: `${''}/repro-1358`,
  router: 'waku',
  description: 'static'
})

testRepro1358({
  path: `${'/dynamic'}/repro-1358`,
  router: 'waku',
  description: 'dynamic'
})
