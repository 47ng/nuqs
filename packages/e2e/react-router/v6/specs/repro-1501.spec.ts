import {
  testRepro1501,
  testRepro1501EmitterRace,
  testRepro1501PathnameChange
} from 'e2e-shared/specs/repro-1501.spec.ts'

testRepro1501({
  path: '/repro-1501'
})

testRepro1501EmitterRace({
  path: '/repro-1501'
})

testRepro1501PathnameChange({
  path: '/repro-1501'
})
