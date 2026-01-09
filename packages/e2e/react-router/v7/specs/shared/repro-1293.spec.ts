import {
  testRepro1293PageA,
  testRepro1293PageB
} from 'e2e-shared/specs/repro-1293.spec.ts'

testRepro1293PageA({
  path: '/repro-1293/pageA',
  router: 'react-router-v7'
})

testRepro1293PageB({
  path: '/repro-1293/pageB',
  router: 'react-router-v7'
})
