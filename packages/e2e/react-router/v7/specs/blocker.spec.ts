import {
  testBlocker,
  testBlockerWithoutLoader
} from 'e2e-shared/specs/react-router/blocker.spec.ts'

testBlocker({ path: '/blocker' })
testBlockerWithoutLoader({ path: '/blocker-no-loader' })
