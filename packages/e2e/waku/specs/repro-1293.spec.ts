import { testRepro1293 } from 'e2e-shared/specs/repro-1293.spec.ts'

testRepro1293({
  path: `${''}/repro-1293`,
  router: 'waku',
  description: 'static'
})

testRepro1293({
  path: `${'/dynamic'}/repro-1293`,
  router: 'waku',
  description: 'dynamic'
})
