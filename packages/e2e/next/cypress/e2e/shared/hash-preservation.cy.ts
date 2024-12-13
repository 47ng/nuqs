import { testHashPreservation } from 'e2e-shared/cypress/e2e/hash-preservation.cy'

describe('hash preservation (app router)', () => {
  it('works in standard routes', () => {
    testHashPreservation('/app/hash-preservation')
  })

  it('works in dynamic routes', () => {
    testHashPreservation('/app/hash-preservation/dynamic/route')
  })
})

describe('hash preservation (pages router)', () => {
  it('works in standard routes', () => {
    testHashPreservation('/pages/hash-preservation')
  })

  it('works in dynamic routes', () => {
    testHashPreservation('/pages/hash-preservation/dynamic/route')
  })
})
