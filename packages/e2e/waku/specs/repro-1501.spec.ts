import { testRepro1501 } from 'e2e-shared/specs/repro-1501.spec.ts'

testRepro1501({
  path: `${''}/repro-1501`,
  router: 'waku',
  description: 'static'
})

testRepro1501({
  path: `${'/dynamic'}/repro-1501`,
  router: 'waku',
  description: 'dynamic'
})
