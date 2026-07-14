import { KNOWN_IMPACT_LABELS } from 'scripts/lib/changelog-dto'
import { describe, expect, it } from 'vitest'
import { LABEL_CLASSES } from './label-classes'

describe('LABEL_CLASSES registry', () => {
  // The classes here and the display names in the codec are parallel maps
  // keyed by the same labels in different packages; a label added to one but
  // not the other degrades at render (raw slug silently, gray badge with a
  // build-log warning).
  it('stays in key parity with the codec display-name vocabulary', () => {
    expect(Object.keys(LABEL_CLASSES).sort()).toEqual(
      [...KNOWN_IMPACT_LABELS].sort()
    )
  })
})
