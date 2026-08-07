import { describe, expect, it } from 'vitest'
import {
  bumpGA,
  greatestGATag,
  greatestTag,
  highestBetaNumber,
  isBeta,
  isGA,
  isValidSemver,
  precedes
} from './version'

describe('isValidSemver', () => {
  it('accepts major.minor.patch with optional suffix', () => {
    expect(isValidSemver('1.2.3')).toBe(true)
    expect(isValidSemver('1.2.3-beta.4')).toBe(true)
  })

  it('accepts v-prefixed GA and beta tags', () => {
    expect(isValidSemver('v1.2.3')).toBe(true)
    expect(isValidSemver('v1.2.3-beta.4')).toBe(true)
  })

  it('rejects junk and partial versions', () => {
    expect(isValidSemver('latest')).toBe(false)
    expect(isValidSemver('v1.2')).toBe(false)
    expect(isValidSemver('nightly')).toBe(false)
  })
})

describe('isGA', () => {
  it('is true only for valid versions with no prerelease segment', () => {
    expect(isGA('v1.2.3')).toBe(true)
    expect(isGA('v1.2.3-beta.4')).toBe(false)
    expect(isGA('latest')).toBe(false)
  })
})

describe('isBeta', () => {
  it('is true only for a vX.Y.Z-beta.N tag (N numeric)', () => {
    expect(isBeta('v1.2.3-beta.4')).toBe(true)
    expect(isBeta('1.2.3-beta.0')).toBe(true)
  })

  it('rejects GA, other prereleases, and malformed beta shapes', () => {
    expect(isBeta('v1.2.3')).toBe(false) // GA, no prerelease
    expect(isBeta('v1.2.3-alpha.1')).toBe(false) // another prerelease id
    expect(isBeta('v1.2.3-rc.1')).toBe(false)
    expect(isBeta('v1.2.3-beta')).toBe(false) // no number
    expect(isBeta('v1.2.3-beta.x')).toBe(false) // non-numeric
    expect(isBeta('v1.2.3-beta.1.2')).toBe(false) // extra segment
    expect(isBeta('latest')).toBe(false) // junk
  })
})

describe('precedes', () => {
  it('orders strictly by semver precedence', () => {
    expect(precedes('v1.2.3', 'v1.2.4')).toBe(true)
    expect(precedes('v1.2.3-beta.1', 'v1.2.3')).toBe(true) // prerelease < GA
    expect(precedes('v1.2.4', 'v1.2.3')).toBe(false)
  })

  it('a version does not precede itself', () => {
    expect(precedes('v1.2.3', 'v1.2.3')).toBe(false)
  })
})

describe('greatestTag', () => {
  it('picks the highest tag of any channel, numerically (v1.2.10 > v1.2.9)', () => {
    expect(greatestTag(['v1.2.9', 'v1.2.10', 'v1.3.0-beta.1'])).toBe(
      'v1.3.0-beta.1'
    )
    expect(greatestTag(['v1.2.9', 'v1.2.10'])).toBe('v1.2.10')
  })

  it('returns null when no tag is a valid version', () => {
    expect(greatestTag([])).toBeNull()
    expect(greatestTag(['latest', 'nightly'])).toBeNull()
  })
})

describe('greatestGATag', () => {
  it('returns the highest GA tag, ignoring betas', () => {
    expect(greatestGATag(['v1.2.3', 'v1.3.0-beta.1', 'v1.2.10'])).toBe(
      'v1.2.10'
    )
  })

  it('returns null when only betas exist', () => {
    expect(greatestGATag(['v1.3.0-beta.1', 'v1.3.0-beta.2'])).toBeNull()
  })
})

describe('highestBetaNumber', () => {
  it('returns the max beta number for the exact target', () => {
    expect(
      highestBetaNumber(
        ['v1.3.0-beta.1', 'v1.3.0-beta.3', 'v1.3.0-beta.2'],
        '1.3.0'
      )
    ).toBe(3)
  })

  it('uses the max, not a count (so a deleted beta cannot cause collision)', () => {
    // beta.2 was deleted; the next must still be 4, not 3.
    expect(highestBetaNumber(['v1.3.0-beta.1', 'v1.3.0-beta.3'], '1.3.0')).toBe(
      3
    )
  })

  it('resets to 0 when the target has no matching betas', () => {
    // A recomputed-higher target sees none of the lower target's betas.
    expect(highestBetaNumber(['v1.2.4-beta.1', 'v1.2.4-beta.2'], '1.3.0')).toBe(
      0
    )
  })

  it('ignores non-beta prereleases for the same target', () => {
    expect(highestBetaNumber(['v1.3.0-alpha.5', 'v1.3.0-rc.2'], '1.3.0')).toBe(
      0
    )
  })
})

describe('bumpGA', () => {
  it('increments by conventional-commit bump', () => {
    expect(bumpGA('1.2.3', 'major')).toBe('2.0.0')
    expect(bumpGA('1.2.3', 'minor')).toBe('1.3.0')
    expect(bumpGA('1.2.3', 'patch')).toBe('1.2.4')
  })

  it('bumps from the 0.0.0 baseline', () => {
    expect(bumpGA('0.0.0', 'minor')).toBe('0.1.0')
  })
})
