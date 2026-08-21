import { testRepro1506 } from 'e2e-shared/specs/repro-1506.spec.ts'

testRepro1506({
  path: `${''}/repro-1506`,
  router: 'waku',
  description: 'static'
})

testRepro1506({
  path: `${'/dynamic'}/repro-1506`,
  router: 'waku',
  description: 'dynamic'
})
