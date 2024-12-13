import { testHashPreservation } from 'e2e-shared/cypress/e2e/hash-preservation.cy'

it('preserves hash on navigation', () => {
  testHashPreservation('/hash-preservation')
})
