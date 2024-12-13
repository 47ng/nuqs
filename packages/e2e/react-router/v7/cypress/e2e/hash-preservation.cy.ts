import { hashPreservation } from 'e2e-shared/cypress/e2e/hash-preservation.cy'

it('preserves hash on navigation', () => {
  hashPreservation('/hash-preservation')
})
