import { hashPreservation } from 'e2e-shared/cypress/e2e/hash-preservation.cy'

describe('hash preservation (app router)', () => {
  it('works in standard routes', () => {
    hashPreservation('/app/hash-preservation')
  })

  it('works in dynamic routes', () => {
    hashPreservation('/app/hash-preservation/dynamic/route')
  })
})

describe('hash preservation (pages router)', () => {
  it('works in standard routes', () => {
    hashPreservation('/pages/hash-preservation')
  })

  it('works in dynamic routes', () => {
    hashPreservation('/pages/hash-preservation/dynamic/route')
  })
})
