import { KNOWN_IMPACT_LABELS } from 'scripts/lib/changelog-dto'
import { describe, expect, it } from 'vitest'
import {
  AAA_CONTRAST,
  contrast,
  FALLBACK_COLOR,
  LABEL_COLORS,
  labelTheme
} from './label-colors'

const ALL_COLORS = [...Object.values(LABEL_COLORS), FALLBACK_COLOR]
const THEMES = ['light', 'dark'] as const

describe('LABEL_COLORS registry', () => {
  // labelTheme's hex parsing assumes exactly #rrggbb; a shorthand or typo'd
  // entry would silently produce garbage colors.
  it('holds only 6-digit lowercase hex colors', () => {
    for (const color of ALL_COLORS) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  // The colors here and the display names in the codec are parallel maps
  // keyed by the same labels in different packages; a label added to one but
  // not the other degrades silently (raw slug, or gray chip) at render.
  it('stays in key parity with the codec display-name vocabulary', () => {
    expect(Object.keys(LABEL_COLORS).sort()).toEqual(
      [...KNOWN_IMPACT_LABELS].sort()
    )
  })
})

describe('labelTheme WCAG guarantees', () => {
  it.each(THEMES)('clears AAA (7:1) for every label color in %s', theme => {
    for (const color of ALL_COLORS) {
      const { bg, fg } = labelTheme(color, theme)
      expect(
        contrast(fg, bg),
        `${color} in ${theme}: ${fg} on ${bg}`
      ).toBeGreaterThanOrEqual(AAA_CONTRAST)
    }
  })

  // The border is what keeps a chip visible when the label color sits near
  // the page background (#ffffff on light, #000000 on dark).
  it.each(THEMES)('keeps every chip border visible in %s', theme => {
    const pageBg = theme === 'light' ? '#ffffff' : '#09090b'
    for (const color of ALL_COLORS) {
      const { border } = labelTheme(color, theme)
      expect(
        contrast(border, pageBg),
        `${color} in ${theme}: border ${border}`
      ).toBeGreaterThanOrEqual(1.5)
    }
  })
})
